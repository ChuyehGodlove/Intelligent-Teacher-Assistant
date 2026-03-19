import { pgTable, serial, integer, timestamp, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { testsTable, questionsTable } from "./tests";
import { studentsTable } from "./students";

export const testResultsTable = pgTable("test_results", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => testsTable.id),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  earnedPoints: integer("earned_points").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const studentAnswersTable = pgTable("student_answers", {
  id: serial("id").primaryKey(),
  resultId: integer("result_id").notNull().references(() => testResultsTable.id),
  questionId: integer("question_id").notNull().references(() => questionsTable.id),
  mcqAnswer: text("mcq_answer"),
  structuredAnswer: text("structured_answer"),
  isCorrect: boolean("is_correct"),
  teacherMarks: integer("teacher_marks"),
  teacherComment: text("teacher_comment"),
});

export const insertTestResultSchema = createInsertSchema(testResultsTable).omit({ id: true, submittedAt: true });
export const insertStudentAnswerSchema = createInsertSchema(studentAnswersTable).omit({ id: true });
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type InsertStudentAnswer = z.infer<typeof insertStudentAnswerSchema>;
export type TestResult = typeof testResultsTable.$inferSelect;
export type StudentAnswer = typeof studentAnswersTable.$inferSelect;
