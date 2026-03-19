import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  teachersTable,
  studentsTable,
  classesTable,
  subjectsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "intelliteach-jwt-secret-2024";
const SALT_ROUNDS = 10;

function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// ─── TEACHER SIGNUP ──────────────────────────────────────────────────────────
router.post("/signup/teacher", async (req, res) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email and password are required" });
    return;
  }

  const existing = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.email, email.toLowerCase()));

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [teacher] = await db
    .insert(teachersTable)
    .values({ name, email: email.toLowerCase(), passwordHash })
    .returning();

  const token = signToken({ role: "teacher", id: teacher!.id, email: teacher!.email });

  res.status(201).json({
    token,
    role: "teacher",
    user: { id: teacher!.id, name: teacher!.name, email: teacher!.email },
  });
});

// ─── TEACHER LOGIN ────────────────────────────────────────────────────────────
router.post("/login/teacher", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [teacher] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.email, email.toLowerCase()));

  if (!teacher) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, teacher.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ role: "teacher", id: teacher.id, email: teacher.email });
  res.json({
    token,
    role: "teacher",
    user: { id: teacher.id, name: teacher.name, email: teacher.email },
  });
});

// ─── STUDENT SIGNUP (email + optional classId) ────────────────────────────────
router.post("/signup/student", async (req, res) => {
  const { name, email, password, classId } = req.body as {
    name: string;
    email: string;
    password: string;
    classId?: number;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email and password are required" });
    return;
  }

  const existing = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.email, email.toLowerCase()));

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  // Validate classId if provided
  let resolvedClassId: number | undefined = undefined;
  let resolvedSubjectId: number | undefined = undefined;
  let resolvedClassName = "";

  if (classId) {
    const [cls] = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, classId));
    if (!cls) {
      res.status(400).json({ error: "Class not found with that ID" });
      return;
    }
    resolvedClassId = cls.id;
    resolvedClassName = cls.name;

    // Link student to subject matching the class subject
    if (cls.subjectId) {
      resolvedSubjectId = cls.subjectId;
    } else {
      // Try to find a subject matching the class's text subject
      const [subj] = await db
        .select()
        .from(subjectsTable)
        .where(eq(subjectsTable.name, cls.subject));
      if (subj) resolvedSubjectId = subj.id;
    }
  }

  // Auto-generate student code
  const allStudents = await db.select({ code: studentsTable.studentCode }).from(studentsTable);
  const maxNum = allStudents.reduce((max, s) => {
    const match = s.code.match(/STU(\d+)/);
    return match ? Math.max(max, parseInt(match[1]!, 10)) : max;
  }, 0);
  const studentCode = `STU${String(maxNum + 1).padStart(3, "0")}`;

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const [student] = await db
    .insert(studentsTable)
    .values({
      name,
      email: email.toLowerCase(),
      studentCode,
      passwordHash,
      classId: resolvedClassId ?? null,
      subjectId: resolvedSubjectId ?? null,
    })
    .returning();

  const token = signToken({
    role: "student",
    id: student!.id,
    studentCode: student!.studentCode,
  });

  res.status(201).json({
    token,
    role: "student",
    user: {
      id: student!.id,
      name: student!.name,
      email: student!.email,
      studentCode: student!.studentCode,
      classId: student!.classId,
      className: resolvedClassName,
    },
  });
});

// ─── STUDENT SIGNUP (class code only — code-based, no password) ───────────────
router.post("/signup/student/by-class", async (req, res) => {
  const { name, classId } = req.body as { name: string; classId: number };

  if (!name || !classId) {
    res.status(400).json({ error: "name and classId are required" });
    return;
  }

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!cls) {
    res.status(400).json({ error: "Class not found" });
    return;
  }

  // Auto-generate student code and email
  const allStudents = await db.select({ code: studentsTable.studentCode }).from(studentsTable);
  const maxNum = allStudents.reduce((max, s) => {
    const match = s.code.match(/STU(\d+)/);
    return match ? Math.max(max, parseInt(match[1]!, 10)) : max;
  }, 0);
  const studentCode = `STU${String(maxNum + 1).padStart(3, "0")}`;
  const autoEmail = `${studentCode.toLowerCase()}@intelliteach.local`;

  let resolvedSubjectId: number | undefined = undefined;
  if (cls.subjectId) {
    resolvedSubjectId = cls.subjectId;
  } else {
    const [subj] = await db
      .select()
      .from(subjectsTable)
      .where(eq(subjectsTable.name, cls.subject));
    if (subj) resolvedSubjectId = subj.id;
  }

  const [student] = await db
    .insert(studentsTable)
    .values({
      name,
      email: autoEmail,
      studentCode,
      classId: cls.id,
      subjectId: resolvedSubjectId ?? null,
      passwordHash: null,
    })
    .returning();

  res.status(201).json({
    studentCode: student!.studentCode,
    name: student!.name,
    classId: student!.classId,
    className: cls.name,
    message: "Account created. Use your student code to access tests.",
  });
});

// ─── STUDENT LOGIN ────────────────────────────────────────────────────────────
router.post("/login/student", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.email, email.toLowerCase()));

  if (!student || !student.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, student.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  let className = "";
  if (student.classId) {
    const [cls] = await db
      .select()
      .from(classesTable)
      .where(eq(classesTable.id, student.classId));
    className = cls?.name ?? "";
  }

  const token = signToken({
    role: "student",
    id: student.id,
    studentCode: student.studentCode,
  });

  res.json({
    token,
    role: "student",
    user: {
      id: student.id,
      name: student.name,
      email: student.email,
      studentCode: student.studentCode,
      classId: student.classId,
      className,
    },
  });
});

// ─── GET ME (token verify) ────────────────────────────────────────────────────
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role === "teacher") {
      const [teacher] = await db
        .select()
        .from(teachersTable)
        .where(eq(teachersTable.id, decoded.id));
      if (!teacher) { res.status(404).json({ error: "User not found" }); return; }
      res.json({ role: "teacher", user: { id: teacher.id, name: teacher.name, email: teacher.email } });
    } else {
      const [student] = await db
        .select()
        .from(studentsTable)
        .where(eq(studentsTable.id, decoded.id));
      if (!student) { res.status(404).json({ error: "User not found" }); return; }
      let className = "";
      if (student.classId) {
        const [cls] = await db
          .select()
          .from(classesTable)
          .where(eq(classesTable.id, student.classId));
        className = cls?.name ?? "";
      }
      res.json({
        role: "student",
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          studentCode: student.studentCode,
          classId: student.classId,
          className,
        },
      });
    }
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
