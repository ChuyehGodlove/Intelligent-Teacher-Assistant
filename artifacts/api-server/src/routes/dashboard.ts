import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  classesTable,
  studentsTable,
  testsTable,
  testResultsTable,
  paperUploadsTable,
} from "@workspace/db/schema";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/overview", async (_req, res) => {
  const [totalClasses] = await db.select({ count: count() }).from(classesTable);
  const [totalStudents] = await db.select({ count: count() }).from(studentsTable);
  const [totalTests] = await db.select({ count: count() }).from(testsTable);
  const [totalUploads] = await db.select({ count: count() }).from(paperUploadsTable);

  const classes = await db.select().from(classesTable);
  const allTests = await db.select().from(testsTable);
  const allResults = await db.select().from(testResultsTable);
  const allStudents = await db.select().from(studentsTable);

  const testMap = new Map(allTests.map((t) => [t.id, t]));
  const studentMap = new Map(allStudents.map((s) => [s.id, s]));

  const classesWithCUI = await Promise.all(
    classes.map(async (c) => {
      const classStudents = allStudents.filter((s) => s.classId === c.id);
      const classTests = allTests.filter((t) => t.classId === c.id);
      const classTestIds = new Set(classTests.map((t) => t.id));
      const classResults = allResults.filter((r) => classTestIds.has(r.testId));

      let averageScore = 0;
      if (classResults.length > 0) {
        const avg = classResults.reduce((sum, r) => {
          return sum + (r.totalPoints > 0 ? (r.earnedPoints / r.totalPoints) * 100 : 0);
        }, 0) / classResults.length;
        averageScore = Math.round(avg * 10) / 10;
      }

      const cuiScore = Math.min(100, Math.round(averageScore));
      const recentTrend = cuiScore >= 70 ? "improving" : cuiScore >= 50 ? "stable" : "declining";

      return {
        classId: c.id,
        className: c.name,
        cuiScore,
        averageScore,
        totalStudents: classStudents.length,
        totalTestsCompleted: classResults.length,
        recentTrend,
        topicBreakdown: [{ topic: c.subject, score: averageScore }],
      };
    })
  );

  const averageCUI =
    classesWithCUI.length > 0
      ? Math.round(
          (classesWithCUI.reduce((sum, c) => sum + c.cuiScore, 0) / classesWithCUI.length) * 10
        ) / 10
      : 0;

  const recentResults = allResults
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
    .slice(0, 10)
    .map((r) => {
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

  res.json({
    totalClasses: totalClasses?.count ?? 0,
    totalStudents: totalStudents?.count ?? 0,
    totalTests: totalTests?.count ?? 0,
    totalUploads: totalUploads?.count ?? 0,
    averageCUI,
    classes: classesWithCUI,
    recentResults,
  });
});

export default router;
