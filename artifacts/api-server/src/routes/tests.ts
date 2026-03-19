import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  testsTable,
  questionsTable,
  studentsTable,
  testResultsTable,
  studentAnswersTable,
  classesTable,
} from "@workspace/db/schema";
import { eq, count, inArray } from "drizzle-orm";
import {
  CreateTestBody,
  GetTestsQueryParams,
  GetTestParams,
  SubmitTestAnswersParams,
  SubmitTestAnswersBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const query = GetTestsQueryParams.safeParse(req.query);
  const classId = query.success ? query.data.classId : undefined;

  const tests = classId
    ? await db.select().from(testsTable).where(eq(testsTable.classId, classId))
    : await db.select().from(testsTable);

  const classes = await db.select().from(classesTable);
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  const result = await Promise.all(
    tests.map(async (t) => {
      const [qCount] = await db
        .select({ count: count() })
        .from(questionsTable)
        .where(eq(questionsTable.testId, t.id));
      return {
        id: t.id,
        title: t.title,
        classId: t.classId,
        className: classMap.get(t.classId) ?? "",
        questionCount: Number(qCount?.count ?? 0),
        durationMinutes: t.durationMinutes,
        isActive: t.isActive,
        createdAt: t.createdAt.toISOString(),
      };
    })
  );
  res.json(result);
});

router.post("/", async (req, res) => {
  const body = CreateTestBody.parse(req.body);
  const { questions, ...testData } = body;

  const [test] = await db.insert(testsTable).values(testData).returning();
  const questionValues = questions.map((q, i) => ({
    testId: test!.id,
    questionText: q.questionText,
    questionType: (q as any).questionType ?? "mcq",
    optionA: (q as any).optionA ?? null,
    optionB: (q as any).optionB ?? null,
    optionC: (q as any).optionC ?? null,
    optionD: (q as any).optionD ?? null,
    correctAnswer: q.correctAnswer ?? null,
    modelAnswer: (q as any).modelAnswer ?? null,
    points: q.points,
    orderIndex: i,
  }));
  await db.insert(questionsTable).values(questionValues);

  const [qCount] = await db
    .select({ count: count() })
    .from(questionsTable)
    .where(eq(questionsTable.testId, test!.id));
  const [c] = await db.select().from(classesTable).where(eq(classesTable.id, test!.classId));

  res.status(201).json({
    id: test!.id,
    title: test!.title,
    classId: test!.classId,
    className: c?.name ?? "",
    questionCount: Number(qCount?.count ?? 0),
    durationMinutes: test!.durationMinutes,
    isActive: test!.isActive,
    createdAt: test!.createdAt.toISOString(),
  });
});

router.get("/:testId", async (req, res) => {
  const { testId } = GetTestParams.parse({ testId: Number(req.params.testId) });
  const [test] = await db.select().from(testsTable).where(eq(testsTable.id, testId));
  if (!test) {
    res.status(404).json({ error: "Test not found" });
    return;
  }
  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.testId, testId))
    .orderBy(questionsTable.orderIndex);

  res.json({
    id: test.id,
    title: test.title,
    classId: test.classId,
    durationMinutes: test.durationMinutes,
    isActive: test.isActive,
    questions: questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      modelAnswer: q.questionType === "structured" ? undefined : undefined, // don't expose model answer to students
      points: q.points,
    })),
  });
});

// Get per-question insights for a test (for teacher AI flagging)
router.get("/:testId/insights", async (req, res) => {
  const testId = Number(req.params.testId);
  const [test] = await db.select().from(testsTable).where(eq(testsTable.id, testId));
  if (!test) {
    res.status(404).json({ error: "Test not found" });
    return;
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.testId, testId))
    .orderBy(questionsTable.orderIndex);

  const allResults = await db
    .select()
    .from(testResultsTable)
    .where(eq(testResultsTable.testId, testId));

  const resultIds = allResults.map((r) => r.id);

  const insights = await Promise.all(
    questions.map(async (q) => {
      let totalAttempts = 0;
      let failedAttempts = 0;

      if (resultIds.length > 0) {
        const answers = await db
          .select()
          .from(studentAnswersTable)
          .where(eq(studentAnswersTable.questionId, q.id));

        const relevantAnswers = answers.filter((a) => resultIds.includes(a.resultId));
        totalAttempts = relevantAnswers.length;
        failedAttempts = relevantAnswers.filter((a) => a.isCorrect === false).length;
      }

      const failureRate = totalAttempts > 0 ? (failedAttempts / totalAttempts) * 100 : 0;
      const flagged = totalAttempts > 0 && failureRate > 50;

      return {
        questionId: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        correctAnswer: q.correctAnswer,
        modelAnswer: q.modelAnswer,
        totalAttempts,
        failedAttempts,
        failureRate: Math.round(failureRate * 10) / 10,
        flagged,
      };
    })
  );

  res.json({ testId, testTitle: test.title, insights });
});

// Get all insights across all tests for a class (for dashboard AI panel)
router.get("/class/:classId/insights", async (req, res) => {
  const classId = Number(req.params.classId);
  const tests = await db.select().from(testsTable).where(eq(testsTable.classId, classId));
  const testIds = tests.map((t) => t.id);

  if (testIds.length === 0) {
    res.json({ flaggedQuestions: [] });
    return;
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(inArray(questionsTable.testId, testIds));

  const allResults = await db
    .select()
    .from(testResultsTable)
    .where(inArray(testResultsTable.testId, testIds));

  const resultIds = allResults.map((r) => r.id);
  const flaggedQuestions: any[] = [];

  if (resultIds.length > 0) {
    for (const q of questions) {
      const answers = await db
        .select()
        .from(studentAnswersTable)
        .where(eq(studentAnswersTable.questionId, q.id));

      const relevant = answers.filter((a) => resultIds.includes(a.resultId));
      if (relevant.length === 0) continue;

      const failed = relevant.filter((a) => a.isCorrect === false).length;
      const failureRate = (failed / relevant.length) * 100;

      if (failureRate > 50) {
        const testInfo = tests.find((t) => t.id === q.testId);
        flaggedQuestions.push({
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          testId: q.testId,
          testTitle: testInfo?.title ?? "",
          failureRate: Math.round(failureRate * 10) / 10,
          failedCount: failed,
          totalAttempts: relevant.length,
        });
      }
    }
  }

  res.json({
    flaggedQuestions: flaggedQuestions.sort((a, b) => b.failureRate - a.failureRate),
  });
});

router.post("/:testId/submit", async (req, res) => {
  const { testId } = SubmitTestAnswersParams.parse({ testId: Number(req.params.testId) });
  const body = SubmitTestAnswersBody.parse(req.body);

  const [test] = await db.select().from(testsTable).where(eq(testsTable.id, testId));
  if (!test) {
    res.status(404).json({ error: "Test not found" });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.studentCode, body.studentCode));
  if (!student) {
    res.status(404).json({ error: "Student not found with that code" });
    return;
  }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.testId, testId));

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  let earnedPoints = 0;
  let totalPoints = 0;

  // Compute points first
  for (const q of questions) {
    totalPoints += q.points;
  }

  // Check if extended answers are provided (structured)
  const extendedAnswers = (body as any).extendedAnswers as Array<{
    questionId: number;
    answer?: string;
    structuredAnswer?: string;
  }> | undefined;

  const answerMap = new Map(body.answers.map((a) => [a.questionId, a.answer]));
  const structuredMap = new Map<number, string>();
  if (extendedAnswers) {
    for (const ea of extendedAnswers) {
      if (ea.structuredAnswer) structuredMap.set(ea.questionId, ea.structuredAnswer);
    }
  }

  // Calculate MCQ points
  for (const answer of body.answers) {
    const q = questionMap.get(answer.questionId);
    if (!q) continue;
    if (q.questionType === "mcq" && q.correctAnswer === answer.answer) {
      earnedPoints += q.points;
    }
  }

  const [result] = await db
    .insert(testResultsTable)
    .values({ testId, studentId: student.id, earnedPoints, totalPoints })
    .returning();

  // Save per-question answers
  const answerInserts = questions.map((q) => {
    const mcqAns = answerMap.get(q.id);
    const structAns = structuredMap.get(q.id);
    let isCorrect: boolean | null = null;
    if (q.questionType === "mcq" && mcqAns) {
      isCorrect = q.correctAnswer === mcqAns;
    }
    return {
      resultId: result!.id,
      questionId: q.id,
      mcqAnswer: mcqAns ?? null,
      structuredAnswer: structAns ?? null,
      isCorrect,
      teacherMarks: null,
      teacherComment: null,
    };
  });

  if (answerInserts.length > 0) {
    await db.insert(studentAnswersTable).values(answerInserts);
  }

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 1000) / 10 : 0;

  res.json({
    id: result!.id,
    testId,
    testTitle: test.title,
    studentId: student.id,
    studentName: student.name,
    studentCode: student.studentCode,
    score: percentage,
    totalPoints,
    earnedPoints,
    percentage,
    submittedAt: result!.submittedAt.toISOString(),
  });
});

export default router;
