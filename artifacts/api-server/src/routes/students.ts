import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { studentsTable, classesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateStudentBody, GetStudentsQueryParams, GetStudentParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const query = GetStudentsQueryParams.safeParse(req.query);
  const classId = query.success ? query.data.classId : undefined;

  const students = classId
    ? await db.select().from(studentsTable).where(eq(studentsTable.classId, classId))
    : await db.select().from(studentsTable);

  const classes = await db.select().from(classesTable);
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  res.json(
    students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      studentCode: s.studentCode,
      classId: s.classId,
      className: classMap.get(s.classId) ?? "",
      createdAt: s.createdAt.toISOString(),
    }))
  );
});

router.post("/", async (req, res) => {
  const body = CreateStudentBody.parse(req.body);

  const allStudents = await db.select({ code: studentsTable.studentCode }).from(studentsTable);
  const maxNum = allStudents.reduce((max, s) => {
    const match = s.code.match(/STU(\d+)/);
    if (match) {
      const n = parseInt(match[1]!, 10);
      return Math.max(max, n);
    }
    return max;
  }, 0);
  const studentCode = `STU${String(maxNum + 1).padStart(3, "0")}`;

  const [student] = await db
    .insert(studentsTable)
    .values({ ...body, studentCode })
    .returning();

  const [c] = await db.select().from(classesTable).where(eq(classesTable.id, student!.classId));

  res.status(201).json({
    id: student!.id,
    name: student!.name,
    email: student!.email,
    studentCode: student!.studentCode,
    classId: student!.classId,
    className: c?.name ?? "",
    createdAt: student!.createdAt.toISOString(),
  });
});

router.get("/:studentId", async (req, res) => {
  const { studentId } = GetStudentParams.parse({ studentId: Number(req.params.studentId) });
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  const [c] = await db.select().from(classesTable).where(eq(classesTable.id, student.classId));
  res.json({
    id: student.id,
    name: student.name,
    email: student.email,
    studentCode: student.studentCode,
    classId: student.classId,
    className: c?.name ?? "",
    createdAt: student.createdAt.toISOString(),
  });
});

export default router;
