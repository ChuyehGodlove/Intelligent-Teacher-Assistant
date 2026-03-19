import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { paperUploadsTable, studentsTable, classesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { GetUploadsQueryParams, ProcessOCRParams } from "@workspace/api-zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const query = GetUploadsQueryParams.safeParse(req.query);
  const classId = query.success ? query.data.classId : undefined;

  const uploads = classId
    ? await db.select().from(paperUploadsTable).where(eq(paperUploadsTable.classId, classId))
    : await db.select().from(paperUploadsTable);

  const students = await db.select().from(studentsTable);
  const studentMap = new Map(students.map((s) => [s.id, s.name]));
  const classes = await db.select().from(classesTable);
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  res.json(
    uploads.map((u) => ({
      id: u.id,
      filename: u.filename,
      originalName: u.originalName,
      studentId: u.studentId ?? undefined,
      studentName: u.studentId ? studentMap.get(u.studentId) : undefined,
      classId: u.classId,
      className: classMap.get(u.classId) ?? "",
      description: u.description ?? undefined,
      ocrStatus: u.ocrStatus,
      ocrText: u.ocrText ?? undefined,
      uploadedAt: u.uploadedAt.toISOString(),
    }))
  );
});

router.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const classId = Number(req.body.classId);
  const studentId = req.body.studentId ? Number(req.body.studentId) : undefined;
  const description = req.body.description ?? undefined;

  const [upload] = await db
    .insert(paperUploadsTable)
    .values({
      filename: file.filename,
      originalName: file.originalname,
      classId,
      studentId,
      description,
      ocrStatus: "pending",
    })
    .returning();

  const students = await db.select().from(studentsTable);
  const studentMap = new Map(students.map((s) => [s.id, s.name]));
  const [c] = await db.select().from(classesTable).where(eq(classesTable.id, classId));

  res.status(201).json({
    id: upload!.id,
    filename: upload!.filename,
    originalName: upload!.originalName,
    studentId: upload!.studentId ?? undefined,
    studentName: upload!.studentId ? studentMap.get(upload!.studentId) : undefined,
    classId: upload!.classId,
    className: c?.name ?? "",
    description: upload!.description ?? undefined,
    ocrStatus: upload!.ocrStatus,
    uploadedAt: upload!.uploadedAt.toISOString(),
  });
});

router.post("/:uploadId/ocr", async (req, res) => {
  const { uploadId } = ProcessOCRParams.parse({ uploadId: Number(req.params.uploadId) });

  const [upload] = await db
    .select()
    .from(paperUploadsTable)
    .where(eq(paperUploadsTable.id, uploadId));
  if (!upload) {
    res.status(404).json({ error: "Upload not found" });
    return;
  }

  await db
    .update(paperUploadsTable)
    .set({ ocrStatus: "processing" })
    .where(eq(paperUploadsTable.id, uploadId));

  setTimeout(async () => {
    const sampleText = `Extracted text from ${upload.originalName}:\n\nStudent work analysis:\n- Topic understanding: Good\n- Key concepts identified\n- Teacher comments detected`;
    await db
      .update(paperUploadsTable)
      .set({ ocrStatus: "completed", ocrText: sampleText })
      .where(eq(paperUploadsTable.id, uploadId));
  }, 2000);

  res.json({
    uploadId,
    status: "processing" as const,
    extractedText: "",
    confidence: 0,
    teacherComments: [],
  });
});

export default router;
