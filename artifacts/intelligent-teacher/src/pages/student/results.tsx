import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, XCircle, Clock, ArrowLeft, Trophy,
  FileText, AlignLeft, AlertCircle, Star,
} from "lucide-react";

const base = import.meta.env.BASE_URL;

export default function StudentResults() {
  const [params] = useRoute("/student/results/:resultId");
  const resultId = Number(params?.resultId);

  const [result, setResult] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "correct" | "wrong" | "pending">("all");

  useEffect(() => {
    if (!resultId) return;
    fetch(`${base}api/results/${resultId}/answers`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setResult(data.result ?? null);
          setAnswers(data.answers ?? []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resultId]);

  if (loading) return <LoadingScreen />;

  const mcqAnswers = answers.filter((a: any) => (a.questionType ?? "mcq") === "mcq");
  const structuredAnswers = answers.filter((a: any) => a.questionType === "structured");
  const mcqCorrect = mcqAnswers.filter((a: any) => a.isCorrect === true).length;
  const mcqTotal = mcqAnswers.length;
  const structuredMarked = structuredAnswers.filter((a: any) => a.teacherMarks !== null).length;
  const structuredPending = structuredAnswers.filter((a: any) => a.teacherMarks === null).length;

  const pct = result
    ? (result.totalPoints > 0 ? Math.round((result.earnedPoints / result.totalPoints) * 1000) / 10 : 0)
    : 0;
  const passed = pct >= 60;

  const filteredAnswers = answers.filter((a: any) => {
    if (activeFilter === "correct") return a.isCorrect === true;
    if (activeFilter === "wrong") return a.isCorrect === false;
    if (activeFilter === "pending") return a.questionType === "structured" && a.teacherMarks === null;
    return true;
  });

  const ScoreRing = ({ pct, size = 130 }: { pct: number; size?: number }) => {
    const r = size / 2 - 10;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const color = pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
    return (
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-8 animate-in fade-in duration-500">
      {/* Back link */}
      <Link href="/student/tests">
        <button className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tests
        </button>
      </Link>

      {/* ── Score card ─────────────────────────────────────────────────────── */}
      <Card className={`overflow-hidden border-2 ${passed ? "border-emerald-200" : "border-orange-200"}`}>
        <div className={`h-3 w-full ${passed ? "bg-emerald-500" : "bg-orange-400"}`} />
        <CardContent className="p-8">
          <div className="flex items-center gap-8 flex-wrap">
            {/* Ring */}
            <div className="relative shrink-0">
              <ScoreRing pct={pct} size={130} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${passed ? "text-emerald-600" : "text-orange-500"}`}>{pct}%</span>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${passed ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                {passed ? <><Trophy className="w-3.5 h-3.5" /> Passed</> : <><AlertCircle className="w-3.5 h-3.5" /> Needs Improvement</>}
              </div>
              <h1 className="text-3xl font-display font-extrabold text-foreground mb-1">
                {result?.testTitle ?? "Test Results"}
              </h1>
              {result && (
                <p className="text-muted-foreground font-semibold text-sm mb-4">
                  {result.earnedPoints} / {result.totalPoints} points
                  {result.submittedAt && <> · Submitted {new Date(result.submittedAt).toLocaleDateString()}</>}
                </p>
              )}

              {/* Quick stats */}
              <div className="flex gap-4 flex-wrap">
                {mcqTotal > 0 && (
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-emerald-700">{mcqCorrect}/{mcqTotal} MCQ correct</span>
                  </div>
                )}
                {structuredPending > 0 && (
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-amber-700">{structuredPending} written pending marking</span>
                  </div>
                )}
                {structuredMarked > 0 && (
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <span className="text-indigo-700">{structuredMarked} written marked</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {structuredPending > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 font-medium">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          Your written answers are awaiting teacher marking. Your MCQ score is shown now — the final score will update once marking is complete.
        </div>
      )}

      {/* ── Filter tabs ────────────────────────────────────────────────────── */}
      {answers.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {([
            { id: "all" as const,     label: `All (${answers.length})` },
            { id: "correct" as const, label: `✓ Correct (${answers.filter(a => a.isCorrect === true).length})` },
            { id: "wrong" as const,   label: `✗ Wrong (${answers.filter(a => a.isCorrect === false).length})` },
            ...(structuredPending > 0 ? [{ id: "pending" as const, label: `⏳ Pending (${structuredPending})` }] : []),
          ]).map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeFilter === f.id ? "bg-primary text-primary-foreground shadow" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Answer breakdown ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredAnswers.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3" />
            <p className="font-medium">No questions in this category</p>
          </div>
        )}

        {filteredAnswers.map((a: any, idx: number) => {
          const isMcq = (a.questionType ?? "mcq") === "mcq";
          const isCorrect = a.isCorrect === true;
          const isWrong = a.isCorrect === false;
          const isPending = !isMcq && a.teacherMarks === null;

          return (
            <Card key={a.answerId ?? idx} className={`overflow-hidden border-2 ${
              isCorrect ? "border-emerald-200" : isWrong ? "border-red-200" : isPending ? "border-amber-200" : "border-indigo-200"
            }`}>
              <div className={`flex items-center justify-between px-5 py-3 border-b ${
                isCorrect ? "bg-emerald-50 border-emerald-100"
                : isWrong ? "bg-red-50 border-red-100"
                : isPending ? "bg-amber-50 border-amber-100"
                : "bg-indigo-50 border-indigo-100"
              }`}>
                <div className="flex items-center gap-2">
                  {isCorrect  && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  {isWrong    && <XCircle      className="w-4 h-4 text-red-500" />}
                  {isPending  && <Clock        className="w-4 h-4 text-amber-500" />}
                  {!isMcq && !isPending && <Star className="w-4 h-4 text-indigo-600" />}
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isCorrect ? "text-emerald-700" : isWrong ? "text-red-600" : isPending ? "text-amber-700" : "text-indigo-700"
                  }`}>
                    {isCorrect ? "Correct" : isWrong ? "Incorrect" : isPending ? "Pending Marking" : "Marked"}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    · {isMcq ? "MCQ" : "Written"}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isCorrect ? "bg-emerald-100 text-emerald-700"
                  : isWrong ? "bg-red-100 text-red-700"
                  : isPending ? "bg-amber-100 text-amber-700"
                  : "bg-indigo-100 text-indigo-700"
                }`}>
                  {isMcq
                    ? (isCorrect ? `+${a.points} pts` : "0 pts")
                    : (a.teacherMarks !== null ? `${a.teacherMarks}/${a.points} pts` : `${a.points} pts max`)
                  }
                </span>
              </div>

              <CardContent className="p-5 space-y-4">
                <p className="font-medium text-foreground">{a.questionText}</p>

                {/* MCQ breakdown */}
                {isMcq && (
                  <div className="space-y-2">
                    {(["A", "B", "C", "D"] as const).map(opt => {
                      const optText = (a as any)[`option${opt}`];
                      if (!optText) return null;
                      const isStudentChoice = a.mcqAnswer === opt;
                      const isCorrectOpt = a.correctAnswer === opt;
                      return (
                        <div key={opt} className={`flex items-center gap-3 p-3 rounded-xl text-sm border ${
                          isCorrectOpt
                            ? "bg-emerald-50 border-emerald-200"
                            : isStudentChoice && !isCorrectOpt
                            ? "bg-red-50 border-red-200"
                            : "bg-secondary/30 border-border/50"
                        }`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCorrectOpt ? "bg-emerald-500 text-white"
                            : isStudentChoice ? "bg-red-500 text-white"
                            : "bg-background border border-border text-muted-foreground"
                          }`}>{opt}</div>
                          <span className={`flex-1 font-medium ${
                            isCorrectOpt ? "text-emerald-800"
                            : isStudentChoice && !isCorrectOpt ? "text-red-800"
                            : "text-muted-foreground"
                          }`}>{optText}</span>
                          {isCorrectOpt && isStudentChoice && <span className="text-xs font-bold text-emerald-600 shrink-0">✓ Your answer</span>}
                          {isCorrectOpt && !isStudentChoice && <span className="text-xs font-bold text-emerald-600 shrink-0">✓ Correct answer</span>}
                          {isStudentChoice && !isCorrectOpt && <span className="text-xs font-bold text-red-600 shrink-0">✗ Your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Written answer */}
                {!isMcq && (
                  <div className="space-y-3">
                    {a.structuredAnswer && (
                      <div className="p-4 bg-secondary/40 rounded-xl border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Your Answer</p>
                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{a.structuredAnswer}</p>
                      </div>
                    )}
                    {a.teacherMarks !== null ? (
                      <div className="flex items-start gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <Star className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-bold text-indigo-800">
                            Teacher marked: {a.teacherMarks}/{a.points} pts
                          </span>
                          {a.teacherComment && (
                            <p className="text-xs text-indigo-700 mt-1 italic">"{a.teacherComment}"</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-800">
                        <Clock className="w-4 h-4 shrink-0" />
                        Awaiting teacher marking.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex justify-center gap-3 pt-4">
        <Link href="/student/dashboard">
          <Button variant="outline" className="rounded-xl gap-2">View My Dashboard</Button>
        </Link>
        <Link href="/student/tests">
          <Button className="rounded-xl gap-2">Back to Tests</Button>
        </Link>
      </div>
    </div>
  );
}
