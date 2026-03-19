import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  testsTable,
  questionsTable,
  studentsTable,
  testResultsTable,
  classesTable,
} from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";
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
        questionCount: qCount?.count ?? 0,
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
    ...q,
    testId: test!.id,
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
    questionCount: qCount?.count ?? 0,
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
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      points: q.points,
    })),
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

  for (const answer of body.answers) {
    const q = questionMap.get(answer.questionId);
    if (!q) continue;
    totalPoints += q.points;
    if (q.correctAnswer === answer.answer) {
      earnedPoints += q.points;
    }
  }

  const [result] = await db
    .insert(testResultsTable)
    .values({
      testId,
      studentId: student.id,
      earnedPoints,
      totalPoints,
    })
    .returning();

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
