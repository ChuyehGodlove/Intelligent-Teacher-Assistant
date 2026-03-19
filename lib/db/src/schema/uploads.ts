import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";
import { studentsTable } from "./students";

export const paperUploadsTable = pgTable("paper_uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  studentId: integer("student_id").references(() => studentsTable.id),
  classId: integer("class_id").notNull().references(() => classesTable.id),
  description: text("description"),
  ocrStatus: text("ocr_status").notNull().default("pending"),
  ocrText: text("ocr_text"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertPaperUploadSchema = createInsertSchema(paperUploadsTable).omit({ id: true, uploadedAt: true });
export type InsertPaperUpload = z.infer<typeof insertPaperUploadSchema>;
export type PaperUpload = typeof paperUploadsTable.$inferSelect;
