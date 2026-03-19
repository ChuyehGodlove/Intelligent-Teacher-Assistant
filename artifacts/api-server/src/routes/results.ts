import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { testResultsTable, testsTable, studentsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { GetResultsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const query = GetResultsQueryParams.safeParse(req.query);
  const { testId, studentId, classId } = query.success ? query.data : {};

  let results = await db.select().from(testResultsTable);

  if (testId) {
    results = results.filter((r) => r.testId === testId);
  }
  if (studentId) {
    results = results.filter((r) => r.studentId === studentId);
  }

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
      submittedAt: r.submittedAt.toISOString(),
    };
  });

  if (classId) {
    const classTests = tests.filter((t) => t.classId === classId).map((t) => t.id);
    mapped = mapped.filter((r) => classTests.includes(r.testId));
  }

  res.json(mapped);
});

export default router;
