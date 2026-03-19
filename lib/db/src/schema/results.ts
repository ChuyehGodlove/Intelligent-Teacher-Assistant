import { pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { testsTable } from "./tests";
import { studentsTable } from "./students";

export const testResultsTable = pgTable("test_results", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => testsTable.id),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  earnedPoints: integer("earned_points").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertTestResultSchema = createInsertSchema(testResultsTable).omit({ id: true, submittedAt: true });
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResultsTable.$inferSelect;
