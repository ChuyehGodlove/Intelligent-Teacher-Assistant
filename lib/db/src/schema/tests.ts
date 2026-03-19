import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

export const testsTable = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  classId: integer("class_id").notNull().references(() => classesTable.id),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => testsTable.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("mcq"),
  optionA: text("option_a"),
  optionB: text("option_b"),
  optionC: text("option_c"),
  optionD: text("option_d"),
  correctAnswer: text("correct_answer"),
  modelAnswer: text("model_answer"),
  points: integer("points").notNull().default(1),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertTestSchema = createInsertSchema(testsTable).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true });
export type InsertTest = z.infer<typeof insertTestSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Test = typeof testsTable.$inferSelect;
export type Question = typeof questionsTable.$inferSelect;
