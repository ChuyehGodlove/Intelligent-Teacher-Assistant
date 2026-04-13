import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  classesTable,
  testsTable,
  questionsTable,
  testResultsTable,
  studentsTable,
  studentAnswersTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

const router: IRouter = Router();

// ── helpers ────────────────────────────────────────────────────────────────

type AnswerRow = typeof studentAnswersTable.$inferSelect;
type ResultRow  = typeof testResultsTable.$inferSelect;

/**
 * Difficulty p-value = correct / total attempts
 */
function calcDifficulty(answers: AnswerRow[]): number {
  if (!answers.length) return 0;
  const correct = answers.filter(a => a.isCorrect === true).length;
  return Math.round((correct / answers.length) * 1000) / 1000;
}

/**
 * Discrimination index D = (U - L) / (N/2)
 * Sort students by total result score, split top/bottom 50%,
 * count how many in each half got this question correct.
 */
function calcDiscrimination(
  answers: AnswerRow[],
  resultScoreMap: Map<number, number>   // resultId → total %
): number {
  if (answers.length < 4) return 0;

  const sorted = [...answers].sort((a, b) => {
    const sa = resultScoreMap.get(a.resultId) ?? 0;
    const sb = resultScoreMap.get(b.resultId) ?? 0;
    return sb - sa;
  });

  const half = Math.floor(sorted.length / 2);
  const upper = sorted.slice(0, half);
  const lower = sorted.slice(sorted.length - half);

  const U = upper.filter(a => a.isCorrect === true).length;
  const L = lower.filter(a => a.isCorrect === true).length;

  const D = (U - L) / half;
  return Math.round(D * 1000) / 1000;
}

/**
 * KR-20 reliability (Kuder-Richardson Formula 20)
 * Only meaningful with ≥ 5 dichotomous items and ≥ 5 students.
 */
function calcKR20(
  questionPValues: number[],
  studentScores: number[],
  maxScore: number
): number {
  const k = questionPValues.length;
  if (k < 2 || studentScores.length < 2 || maxScore === 0) return 0;

  const variance = (() => {
    const mean = studentScores.reduce((s, v) => s + v, 0) / studentScores.length;
    const sq = studentScores.reduce((s, v) => s + (v - mean) ** 2, 0);
    return sq / studentScores.length;
  })();

  if (variance === 0) return 0;

  const sumPQ = questionPValues.reduce((s, p) => s + p * (1 - p), 0);
  const kr20 = (k / (k - 1)) * (1 - sumPQ / variance);
  return Math.round(Math.max(0, Math.min(1, kr20)) * 1000) / 1000;
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
router.get("/class/:classId/overview", async (req, res) => {
  const classId = Number(req.params.classId);

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!cls) { res.status(404).json({ error: "Class not found" }); return; }

  const tests = await db.select().from(testsTable).where(eq(testsTable.classId, classId));
  const testIds = tests.map(t => t.id);

  const students = await db.select().from(studentsTable).where(eq(studentsTable.classId, classId));

  if (!testIds.length) {
    res.json({
      className: cls.name,
      totalStudents: students.length,
      totalTests: 0,
      totalSubmissions: 0,
      averageScore: 0,
      scoreDistribution: [0, 0, 0, 0, 0],
      reliabilityKR20: 0,
      topStrengths: [],
      topWeaknesses: [],
    });
    return;
  }

  const results = await db
    .select()
    .from(testResultsTable)
    .where(inArray(testResultsTable.testId, testIds));

  const percentages = results.map(r =>
    r.totalPoints > 0 ? (r.earnedPoints / r.totalPoints) * 100 : 0
  );

  const averageScore = percentages.length
    ? Math.round(percentages.reduce((s, v) => s + v, 0) / percentages.length * 10) / 10
    : 0;

  // Score distribution buckets: 0-20, 21-40, 41-60, 61-80, 81-100
  const distribution = [0, 0, 0, 0, 0];
  for (const p of percentages) {
    const bucket = Math.min(4, Math.floor(p / 20));
    distribution[bucket]++;
  }

  // KR-20 per test, then average
  const allQuestions = testIds.length
    ? await db.select().from(questionsTable).where(inArray(questionsTable.testId, testIds))
    : [];

  const resultScoreMap = new Map(
    results.map(r => [r.id, r.totalPoints > 0 ? (r.earnedPoints / r.totalPoints) * 100 : 0])
  );

  const allAnswers = results.length
    ? await db.select().from(studentAnswersTable).where(inArray(studentAnswersTable.resultId, results.map(r => r.id)))
    : [];

  const mcqQuestions = allQuestions.filter(q => q.questionType === "mcq");
  const pValues = mcqQuestions.map(q => {
    const qAnswers = allAnswers.filter(a => a.questionId === q.id);
    return calcDifficulty(qAnswers);
  });

  const studentScores = percentages;
  const maxScore = 100;
  const reliabilityKR20 = calcKR20(pValues, studentScores, maxScore);

  // Topic strengths/weaknesses per test
  const testPerf = tests.map(t => {
    const tResults = results.filter(r => r.testId === t.id);
    const avg = tResults.length
      ? tResults.reduce((s, r) => s + (r.totalPoints > 0 ? (r.earnedPoints / r.totalPoints) * 100 : 0), 0) / tResults.length
      : 0;
    return { title: t.title, avg: Math.round(avg * 10) / 10 };
  }).sort((a, b) => b.avg - a.avg);

  const topStrengths = testPerf.slice(0, 3);
  const topWeaknesses = [...testPerf].reverse().slice(0, 3);

  res.json({
    className: cls.name,
    classCode: cls.classCode,
    totalStudents: students.length,
    totalTests: tests.length,
    totalSubmissions: results.length,
    averageScore,
    scoreDistribution: distribution,
    reliabilityKR20,
    topStrengths,
    topWeaknesses,
  });
});

// ── ITEM ANALYSIS ─────────────────────────────────────────────────────────────
router.get("/class/:classId/items", async (req, res) => {
  const classId = Number(req.params.classId);

  const tests = await db.select().from(testsTable).where(eq(testsTable.classId, classId));
  const testIds = tests.map(t => t.id);

  if (!testIds.length) { res.json({ items: [] }); return; }

  const questions = await db
    .select()
    .from(questionsTable)
    .where(inArray(questionsTable.testId, testIds));

  const results = await db
    .select()
    .from(testResultsTable)
    .where(inArray(testResultsTable.testId, testIds));

  if (!results.length) { res.json({ items: [] }); return; }

  const resultScoreMap = new Map(
    results.map(r => [r.id, r.totalPoints > 0 ? (r.earnedPoints / r.totalPoints) * 100 : 0])
  );

  const allAnswers = await db
    .select()
    .from(studentAnswersTable)
    .where(inArray(studentAnswersTable.resultId, results.map(r => r.id)));

  const testMap = new Map(tests.map(t => [t.id, t]));

  const items = questions.map((q, globalIdx) => {
    const qAnswers = allAnswers.filter(a => a.questionId === q.id);
    const testAnswers = qAnswers.filter(a =>
      results.some(r => r.id === a.resultId && r.testId === q.testId)
    );

    const pValue = calcDifficulty(testAnswers);
    const discrimination = calcDiscrimination(testAnswers, resultScoreMap);

    // Distractor analysis (MCQ only)
    let distractorData: Record<string, number> = {};
    let mostPopularWrong: string | null = null;
    let commonMisconception = false;

    if (q.questionType === "mcq") {
      const optCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const a of testAnswers) {
        const ans = (a.mcqAnswer ?? "").toUpperCase();
        if (ans in optCounts) optCounts[ans]++;
      }
      const total = testAnswers.length || 1;
      distractorData = Object.fromEntries(
        Object.entries(optCounts).map(([k, v]) => [k, Math.round((v / total) * 100)])
      );

      // Find most popular wrong answer
      const wrongOpts = Object.entries(optCounts)
        .filter(([k]) => k !== q.correctAnswer)
        .sort((a, b) => b[1] - a[1]);

      if (wrongOpts.length && wrongOpts[0]![1] > 0) {
        mostPopularWrong = wrongOpts[0]![0];
        // Common misconception: any wrong option chosen by > 30%
        commonMisconception = wrongOpts.some(([, v]) => (v / total) > 0.3);
      }
    }

    const testInfo = testMap.get(q.testId);

    return {
      questionId: q.id,
      testId: q.testId,
      testTitle: testInfo?.title ?? "",
      globalIndex: globalIdx + 1,
      questionText: q.questionText,
      questionType: q.questionType,
      correctAnswer: q.correctAnswer,
      options: {
        A: q.optionA,
        B: q.optionB,
        C: q.optionC,
        D: q.optionD,
      },
      points: q.points,
      totalAttempts: testAnswers.length,
      pValue,
      discrimination,
      distractorData,
      mostPopularWrong,
      commonMisconception,
    };
  });

  res.json({ items });
});

// ── STUDENT PERFORMANCE ────────────────────────────────────────────────────────
router.get("/class/:classId/students", async (req, res) => {
  const classId = Number(req.params.classId);

  const students = await db.select().from(studentsTable).where(eq(studentsTable.classId, classId));
  const tests = await db.select().from(testsTable).where(eq(testsTable.classId, classId));
  const testIds = tests.map(t => t.id);

  if (!testIds.length) {
    res.json({ students: students.map(s => ({
      id: s.id, name: s.name, studentCode: s.studentCode,
      testsTaken: 0, averageScore: 0, scores: [], strengths: [], weaknesses: [],
    })) });
    return;
  }

  const allResults = await db
    .select()
    .from(testResultsTable)
    .where(inArray(testResultsTable.testId, testIds));

  const allAnswers = allResults.length
    ? await db.select().from(studentAnswersTable).where(inArray(studentAnswersTable.resultId, allResults.map(r => r.id)))
    : [];

  const allQuestions = await db
    .select()
    .from(questionsTable)
    .where(inArray(questionsTable.testId, testIds));

  const testMap = new Map(tests.map(t => [t.id, t]));
  const questionMap = new Map(allQuestions.map(q => [q.id, q]));

  const studentRows = students.map(s => {
    const sResults = allResults.filter(r => r.studentId === s.id);
    const sAnswers = allAnswers.filter(a =>
      sResults.some(r => r.id === a.resultId)
    );

    const scores = sResults.map(r => ({
      testId: r.testId,
      testTitle: testMap.get(r.testId)?.title ?? "",
      earnedPoints: r.earnedPoints,
      totalPoints: r.totalPoints,
      percentage: r.totalPoints > 0 ? Math.round((r.earnedPoints / r.totalPoints) * 1000) / 10 : 0,
    }));

    const averageScore = scores.length
      ? Math.round(scores.reduce((s, sc) => s + sc.percentage, 0) / scores.length * 10) / 10
      : 0;

    // Per-question performance
    const questionPerf = sAnswers.map(a => {
      const q = questionMap.get(a.questionId);
      if (!q) return null;
      const isOk = q.questionType === "mcq"
        ? a.isCorrect === true
        : (a.teacherMarks ?? 0) >= q.points * 0.6;
      return { questionText: q.questionText, ok: isOk };
    }).filter(Boolean) as { questionText: string; ok: boolean }[];

    const strengths = questionPerf.filter(q => q.ok).map(q => q.questionText.slice(0, 50));
    const weaknesses = questionPerf.filter(q => !q.ok).map(q => q.questionText.slice(0, 50));

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode,
      testsTaken: sResults.length,
      averageScore,
      scores,
      strengths: strengths.slice(0, 5),
      weaknesses: weaknesses.slice(0, 5),
    };
  });

  res.json({ students: studentRows });
});

// ── AI INSIGHTS ────────────────────────────────────────────────────────────────
router.get("/class/:classId/insights", async (req, res) => {
  const classId = Number(req.params.classId);

  const tests = await db.select().from(testsTable).where(eq(testsTable.classId, classId));
  const testIds = tests.map(t => t.id);

  const insights: { type: string; severity: "info" | "warning" | "critical"; message: string }[] = [];

  if (!testIds.length) {
    res.json({ insights: [{ type: "no_data", severity: "info", message: "No tests have been created yet. Create a test to see AI insights." }] });
    return;
  }

  const questions = await db.select().from(questionsTable).where(inArray(questionsTable.testId, testIds));
  const results = await db.select().from(testResultsTable).where(inArray(testResultsTable.testId, testIds));

  if (!results.length) {
    res.json({ insights: [{ type: "no_submissions", severity: "info", message: "No students have submitted tests yet. Insights will appear after first submissions." }] });
    return;
  }

  const allAnswers = await db
    .select()
    .from(studentAnswersTable)
    .where(inArray(studentAnswersTable.resultId, results.map(r => r.id)));

  const resultScoreMap = new Map(
    results.map(r => [r.id, r.totalPoints > 0 ? (r.earnedPoints / r.totalPoints) * 100 : 0])
  );

  const percentages = results.map(r =>
    r.totalPoints > 0 ? (r.earnedPoints / r.totalPoints) * 100 : 0
  );
  const classAvg = percentages.reduce((s, v) => s + v, 0) / (percentages.length || 1);

  if (classAvg < 50) {
    insights.push({
      type: "low_class_average",
      severity: "critical",
      message: `Class average is ${Math.round(classAvg)}% — significantly below the 60% threshold. Consider reteaching core concepts before the next test.`,
    });
  } else if (classAvg < 65) {
    insights.push({
      type: "below_average",
      severity: "warning",
      message: `Class average is ${Math.round(classAvg)}%. Students are underperforming — review recent test questions and provide targeted feedback.`,
    });
  }

  // Per-question insights
  let badQuestionCount = 0;
  for (const q of questions) {
    const qAnswers = allAnswers.filter(a => a.questionId === q.id);
    if (!qAnswers.length) continue;

    const p = calcDifficulty(qAnswers);
    const D = calcDiscrimination(qAnswers, resultScoreMap);

    if (p < 0.2) {
      insights.push({
        type: "too_hard",
        severity: "warning",
        message: `"${q.questionText.slice(0, 60)}…" is very difficult (p=${p}) — only ${Math.round(p * 100)}% of students answered correctly. Consider revisiting this topic.`,
      });
      badQuestionCount++;
    } else if (p > 0.85) {
      insights.push({
        type: "too_easy",
        severity: "info",
        message: `"${q.questionText.slice(0, 60)}…" may be too easy (p=${p}) — ${Math.round(p * 100)}% got it right. Consider adding more challenging variations.`,
      });
    }

    if (q.questionType === "mcq" && D < 0.2 && D !== 0) {
      insights.push({
        type: "poor_discrimination",
        severity: "warning",
        message: `Question "${q.questionText.slice(0, 60)}…" has poor discrimination (D=${D}). It doesn't distinguish high from low performers — revise distractors or replace it.`,
      });
    }

    if (q.questionType === "mcq") {
      const total = qAnswers.length;
      const wrongCounts: Record<string, number> = {};
      for (const a of qAnswers) {
        const ans = (a.mcqAnswer ?? "").toUpperCase();
        if (ans && ans !== q.correctAnswer) {
          wrongCounts[ans] = (wrongCounts[ans] ?? 0) + 1;
        }
      }
      for (const [opt, count] of Object.entries(wrongCounts)) {
        if (count / total > 0.35) {
          const optText = opt === "A" ? q.optionA : opt === "B" ? q.optionB : opt === "C" ? q.optionC : q.optionD;
          insights.push({
            type: "common_misconception",
            severity: "critical",
            message: `${Math.round((count / total) * 100)}% of students chose Option ${opt} ("${(optText ?? "").slice(0, 40)}") instead of the correct answer in "${q.questionText.slice(0, 50)}…". This is a common misconception — address it directly in class.`,
          });
        }
      }
    }
  }

  // What-if reliability analysis
  const mcqQ = questions.filter(q => q.questionType === "mcq");
  const pValues = mcqQ.map(q => {
    const qAnswers = allAnswers.filter(a => a.questionId === q.id);
    return calcDifficulty(qAnswers);
  });
  const kr20Before = calcKR20(pValues, percentages, 100);

  if (badQuestionCount >= 2 && pValues.length > badQuestionCount) {
    const goodPValues = pValues.filter(p => p >= 0.2 && p <= 0.85);
    const kr20After = calcKR20(goodPValues, percentages, 100);
    if (kr20After > kr20Before + 0.05) {
      insights.push({
        type: "reliability_boost",
        severity: "info",
        message: `What-if: Removing ${badQuestionCount} poorly-performing questions would raise test reliability from KR-20 = ${kr20Before} → ${kr20After}. Consider revising or replacing those questions.`,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: "all_good",
      severity: "info",
      message: "Test quality looks solid. All questions have good difficulty and discrimination levels. Keep up the great work!",
    });
  }

  res.json({ insights, classAvg: Math.round(classAvg * 10) / 10 });
});

export default router;
