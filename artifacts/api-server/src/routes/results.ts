import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  testResultsTable,
  testsTable,
  studentsTable,
  questionsTable,
  studentAnswersTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { GetResultsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const query = GetResultsQueryParams.safeParse(req.query);
  const { testId, studentId, classId } = query.success ? query.data : {};

  let results = await db.select().from(testResultsTable);

  if (testId) results = results.filter((r) => r.testId === testId);
  if (studentId) results = results.filter((r) => r.studentId === studentId);

  const tests = await db.select().from(testsTable);
  const testMap = new Map(tests.map((t) => [t.id, t]));
  const students = await db.select().from(studentsTable);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  let mapped = results.map((r) => {
    const test = testMap.get(r.testId);
    const student = studentMap.get(r.studentId);
    const percentage = r.totalPoints > 0 ? Math.round((r.earnedPoints / r.totalPoints) * 1000) / 10 : 0;
    return {
      id: r.id,
      testId: r.testId,
      testTitle: test?.title ?? "",
      studentId: r.studentId,
      studentName: student?.name ?? "",
      studentCode: student?.studentCode ?? "",
      score: percentage,
      totalPoints: r.totalPoints,
      earnedPoints: r.earnedPoints,
      percentage,
      status: r.status,
      submittedAt: r.submittedAt.toISOString(),
    };
  });

  if (classId) {
    const classTests = tests.filter((t) => t.classId === classId).map((t) => t.id);
    mapped = mapped.filter((r) => classTests.includes(r.testId));
  }

  res.json(mapped);
});

// Get full submission details (student answers) for a specific result
router.get("/:resultId/answers", async (req, res) => {
  const resultId = Number(req.params.resultId);
  const [result] = await db.select().from(testResultsTable).where(eq(testResultsTable.id, resultId));
  if (!result) { res.status(404).json({ error: "Result not found" }); return; }

  const answers = await db.select().from(studentAnswersTable).where(eq(studentAnswersTable.resultId, resultId));
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.testId, result.testId));
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const enriched = answers.map((a) => {
    const q = questionMap.get(a.questionId);
    return {
      answerId: a.id,
      questionId: a.questionId,
      questionText: q?.questionText ?? "",
      questionType: q?.questionType ?? "mcq",
      correctAnswer: q?.correctAnswer,
      modelAnswer: q?.modelAnswer,
      points: q?.points ?? 0,
      mcqAnswer: a.mcqAnswer,
      structuredAnswer: a.structuredAnswer,
      isCorrect: a.isCorrect,
      teacherMarks: a.teacherMarks,
      teacherComment: a.teacherComment,
      aiCategory: computeAiCategory(a.teacherMarks, q?.points ?? 0, a.structuredAnswer ?? "", q?.modelAnswer ?? ""),
    };
  });

  res.json({ resultId, answers: enriched });
});

// Teacher marks a structured answer
router.post("/:resultId/mark", async (req, res) => {
  const resultId = Number(req.params.resultId);
  const { answerId, marks, comment } = req.body as {
    answerId: number;
    marks: number;
    comment?: string;
  };

  if (marks === undefined || marks === null) {
    res.status(400).json({ error: "marks is required" });
    return;
  }

  const [answer] = await db
    .select()
    .from(studentAnswersTable)
    .where(and(eq(studentAnswersTable.id, answerId), eq(studentAnswersTable.resultId, resultId)));

  if (!answer) {
    res.status(404).json({ error: "Answer not found" });
    return;
  }

  const [question] = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.id, answer.questionId));

  const cappedMarks = Math.min(marks, question?.points ?? marks);

  await db
    .update(studentAnswersTable)
    .set({ teacherMarks: cappedMarks, teacherComment: comment ?? null })
    .where(eq(studentAnswersTable.id, answerId));

  // Update the result's earnedPoints
  const allAnswers = await db
    .select()
    .from(studentAnswersTable)
    .where(eq(studentAnswersTable.resultId, resultId));

  const allQuestions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.testId, (await db.select().from(testResultsTable).where(eq(testResultsTable.id, resultId)))[0]!.testId));

  const qMap = new Map(allQuestions.map((q) => [q.id, q]));

  let earnedPoints = 0;
  for (const a of allAnswers) {
    const q = qMap.get(a.questionId);
    if (!q) continue;
    if (q.questionType === "mcq") {
      earnedPoints += a.isCorrect ? q.points : 0;
    } else if (q.questionType === "structured") {
      const m = a.questionId === answer.questionId ? cappedMarks : (a.teacherMarks ?? 0);
      earnedPoints += m;
    }
  }

  await db
    .update(testResultsTable)
    .set({ earnedPoints })
    .where(eq(testResultsTable.id, resultId));

  const aiCategory = computeAiCategory(cappedMarks, question?.points ?? 0, answer.structuredAnswer ?? "", question?.modelAnswer ?? "");

  res.json({
    answerId,
    resultId,
    marks: cappedMarks,
    comment,
    aiCategory,
    earnedPoints,
  });
});

// ── AI error categorization ─────────────────────────────────────────────────
function computeAiCategory(
  marks: number | null,
  totalPoints: number,
  studentAnswer: string,
  modelAnswer: string
): string {
  if (marks === null || marks === undefined) return "ungraded";
  if (totalPoints === 0) return "ungraded";

  const ratio = marks / totalPoints;

  // Keyword-based check: if student answer is very short or has no overlap with model answer keywords
  const modelKeywords = modelAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  const studentWords = studentAnswer.toLowerCase().split(/\s+/);
  const overlap = modelKeywords.filter(k => studentWords.some(w => w.includes(k))).length;
  const coverageRatio = modelKeywords.length > 0 ? overlap / modelKeywords.length : 0.5;

  if (ratio >= 0.8) return "correct";
  if (ratio >= 0.5 && coverageRatio >= 0.3) return "procedural_error";
  if (ratio < 0.3 || coverageRatio < 0.15) return "conceptual_error";
  return "procedural_error";
}

export default router;
