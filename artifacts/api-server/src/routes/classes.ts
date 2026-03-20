import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { classesTable, studentsTable, testsTable, testResultsTable } from "@workspace/db/schema";
import { eq, count, sql } from "drizzle-orm";
import {
  CreateClassBody,
  GetClassCUIParams,
  GetClassParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateClassCode(name: string, subject: string, grade: string): string {
  const nameAbbr = name.replace(/\s+/g, "").slice(0, 4).toUpperCase();
  const subjectAbbr = subject.slice(0, 3).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${nameAbbr}-${subjectAbbr}-${random}`;
}

router.get("/", async (_req, res) => {
  const classes = await db.select().from(classesTable);
  const result = await Promise.all(
    classes.map(async (c) => {
      const [studentCount] = await db
        .select({ count: count() })
        .from(studentsTable)
        .where(eq(studentsTable.classId, c.id));
      return {
        id: c.id,
        name: c.name,
        subject: c.subject,
        grade: c.grade,
        classCode: c.classCode ?? "",
        studentCount: studentCount?.count ?? 0,
        createdAt: c.createdAt.toISOString(),
      };
    })
  );
  res.json(result);
});

router.post("/", async (req, res) => {
  const body = CreateClassBody.parse(req.body);

  // Generate a unique class code
  let classCode: string;
  let attempts = 0;
  do {
    classCode = generateClassCode(body.name, body.subject, body.grade);
    const existing = await db.select({ id: classesTable.id }).from(classesTable).where(eq(classesTable.classCode, classCode));
    if (existing.length === 0) break;
    attempts++;
  } while (attempts < 10);

  const [newClass] = await db
    .insert(classesTable)
    .values({ ...body, classCode })
    .returning();

  res.status(201).json({
    id: newClass!.id,
    name: newClass!.name,
    subject: newClass!.subject,
    grade: newClass!.grade,
    classCode: newClass!.classCode ?? "",
    studentCount: 0,
    createdAt: newClass!.createdAt.toISOString(),
  });
});

router.get("/:classId", async (req, res) => {
  const { classId } = GetClassParams.parse({ classId: Number(req.params.classId) });
  const [c] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!c) { res.status(404).json({ error: "Class not found" }); return; }
  const [studentCount] = await db
    .select({ count: count() })
    .from(studentsTable)
    .where(eq(studentsTable.classId, classId));
  res.json({
    id: c.id,
    name: c.name,
    subject: c.subject,
    grade: c.grade,
    classCode: c.classCode ?? "",
    studentCount: studentCount?.count ?? 0,
    createdAt: c.createdAt.toISOString(),
  });
});

router.get("/:classId/cui", async (req, res) => {
  const { classId } = GetClassCUIParams.parse({ classId: Number(req.params.classId) });
  const [c] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!c) { res.status(404).json({ error: "Class not found" }); return; }

  const [studentCount] = await db
    .select({ count: count() })
    .from(studentsTable)
    .where(eq(studentsTable.classId, classId));

  const classTests = await db
    .select({ id: testsTable.id })
    .from(testsTable)
    .where(eq(testsTable.classId, classId));
  const testIds = classTests.map((t) => t.id);

  let averageScore = 0;
  let totalTestsCompleted = 0;
  if (testIds.length > 0) {
    const results = await db
      .select({ earned: testResultsTable.earnedPoints, total: testResultsTable.totalPoints })
      .from(testResultsTable)
      .where(sql`${testResultsTable.testId} = ANY(${sql.raw(`ARRAY[${testIds.join(",")}]`)})`);
    totalTestsCompleted = results.length;
    if (results.length > 0) {
      const avg_ = results.reduce((sum, r) => sum + (r.total > 0 ? (r.earned / r.total) * 100 : 0), 0) / results.length;
      averageScore = Math.round(avg_ * 10) / 10;
    }
  }

  const cuiScore = Math.min(100, Math.round(averageScore));
  const recentTrend = cuiScore >= 70 ? "improving" : cuiScore >= 50 ? "stable" : "declining";

  res.json({
    classId: c.id,
    className: c.name,
    classCode: c.classCode ?? "",
    cuiScore,
    averageScore,
    totalStudents: studentCount?.count ?? 0,
    totalTestsCompleted,
    recentTrend,
    topicBreakdown: [{ topic: c.subject, score: averageScore }],
  });
});

// Enroll student by class code
router.post("/enroll", async (req, res) => {
  const { classCode } = req.body as { classCode: string };
  if (!classCode) { res.status(400).json({ error: "classCode is required" }); return; }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.classCode, classCode.toUpperCase()));
  if (!cls) { res.status(404).json({ error: "No class found with that code" }); return; }

  res.json({
    id: cls.id,
    name: cls.name,
    subject: cls.subject,
    grade: cls.grade,
    classCode: cls.classCode,
  });
});

export default router;
