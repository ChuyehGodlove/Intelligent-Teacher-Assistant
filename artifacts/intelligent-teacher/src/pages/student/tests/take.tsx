import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetTest, useSubmitTestAnswers } from "@workspace/api-client-react";
import { useStudent } from "@/context/StudentContext";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Clock, FileText, AlignLeft,
  ChevronLeft, ChevronRight, Lock, Upload, Loader2
} from "lucide-react";
import type { TestResult } from "@workspace/api-client-react";

type SectionTab = "mcq" | "structured";

interface SubmissionLock {
  submitted: boolean;
  result?: { id: number; earnedPoints: number; totalPoints: number; percentage: number; submittedAt: string };
}

interface ScanUpload {
  questionId: number;
  file: File | null;
  uploading: boolean;
  uploaded: boolean;
}

export default function TakeTest() {
  const [params] = useRoute("/student/tests/:id");
  const testId = Number(params?.id);

  const { studentCode, studentInfo } = useStudent();
  const [, setLocation] = useLocation();

  const { data: test, isLoading } = useGetTest(testId, { query: { enabled: !!testId } });
  const submitMut = useSubmitTestAnswers();

  // Section tabs
  const [activeTab, setActiveTab] = useState<SectionTab>("mcq");

  // Answers
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, string>>({});
  const [structuredAnswers, setStructuredAnswers] = useState<Record<number, string>>({});
  const [scanUploads, setScanUploads] = useState<Record<number, ScanUpload>>({});

  // Navigation (for one-by-one within a section)
  const [mcqIdx, setMcqIdx] = useState(0);
  const [structIdx, setStructIdx] = useState(0);

  // Submission lock
  const [submissionLock, setSubmissionLock] = useState<SubmissionLock | null>(null);
  const [lockLoading, setLockLoading] = useState(true);

  // Timer
  const [result, setResult] = useState<TestResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    if (!studentCode) setLocation("/student");
  }, [studentCode]);

  // Check submission lock on mount
  useEffect(() => {
    if (!testId || !studentCode) return;
    const checkLock = async () => {
      try {
        const res = await fetch(
          `${base}api/tests/${testId}/submission-status?studentCode=${encodeURIComponent(studentCode)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSubmissionLock(data);
        }
      } catch {}
      setLockLoading(false);
    };
    checkLock();
  }, [testId, studentCode]);

  useEffect(() => {
    if (test && timeLeft === null) setTimeLeft(test.durationMinutes * 60);
  }, [test]);

  useEffect(() => {
    if (timeLeft === null || result || submissionLock?.submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timeLeft !== null, !!result, submissionLock?.submitted]);

  if (isLoading || lockLoading) return <LoadingScreen />;

  if (!test) return (
    <div className="max-w-lg mx-auto mt-24 text-center">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <FileText className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
      <p className="text-muted-foreground mb-6">This test doesn't exist or has been removed.</p>
      <Button onClick={() => setLocation("/student/tests")}>Back to Tests</Button>
    </div>
  );

  // Categorise questions
  const mcqQuestions = test.questions.filter((q: any) => (q.questionType ?? "mcq") === "mcq");
  const structuredQuestions = test.questions.filter((q: any) => (q.questionType ?? "mcq") === "structured");

  const hasMcq = mcqQuestions.length > 0;
  const hasStructured = structuredQuestions.length > 0;

  // ── Already submitted ────────────────────────────────────────────────────────
  if (submissionLock?.submitted && !result) {
    const r = submissionLock.result;
    const pct = r?.percentage ?? 0;
    const passed = pct >= 60;
    return (
      <div className="max-w-2xl mx-auto text-center mt-12 animate-in zoom-in-95 duration-500">
        <Card className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className={`h-4 w-full ${passed ? "bg-emerald-500" : "bg-orange-400"}`} />
          <CardContent className="p-12">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">Already Submitted</h2>
            <p className="text-muted-foreground mb-8">
              You've already submitted this test. Submissions are final and cannot be re-taken.
            </p>
            {r && (
              <div className="inline-block bg-secondary rounded-3xl p-8 mb-8">
                <div className={`text-6xl font-black mb-2 ${passed ? "text-emerald-600" : "text-orange-500"}`}>
                  {pct}%
                </div>
                <p className="font-bold text-muted-foreground">
                  {r.earnedPoints} / {r.totalPoints} pts
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted {new Date(r.submittedAt).toLocaleDateString()}
                </p>
              </div>
            )}
            <Button onClick={() => setLocation("/student/tests")} className="w-full max-w-xs h-12 rounded-xl">
              Back to My Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Submitted result ─────────────────────────────────────────────────────────
  if (result) {
    const passed = result.percentage >= 60;
    return (
      <div className="max-w-2xl mx-auto text-center mt-12 animate-in zoom-in-95 duration-500">
        <Card className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className={`h-4 w-full ${passed ? "bg-emerald-500" : "bg-orange-400"}`} />
          <CardContent className="p-12">
            <CheckCircle2 className={`w-20 h-20 mx-auto mb-6 ${passed ? "text-emerald-500" : "text-orange-400"}`} />
            <h2 className="text-4xl font-display font-extrabold mb-6">Test Submitted!</h2>
            <div className="inline-block bg-secondary rounded-3xl p-8 mb-8">
              <div className={`text-7xl font-black mb-2 ${passed ? "text-emerald-600" : "text-orange-500"}`}>
                {result.percentage}%
              </div>
              <p className="text-lg font-bold text-muted-foreground">
                {result.earnedPoints} / {result.totalPoints} pts
              </p>
              {hasStructured && (
                <p className="text-xs text-muted-foreground mt-2 max-w-xs">
                  Written answers will be marked by your teacher. Your final score may change.
                </p>
              )}
            </div>
            <Button onClick={() => setLocation("/student/tests")} className="w-full max-w-xs h-12 rounded-xl">
              Back to My Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const timeWarning = timeLeft !== null && timeLeft < 120;

  const isMcqAnswered = (qId: number) => !!mcqAnswers[qId];
  const isStructAnswered = (qId: number) => (structuredAnswers[qId] ?? "").trim().length > 0 || scanUploads[qId]?.uploaded;

  const mcqAnsweredCount = mcqQuestions.filter((q: any) => isMcqAnswered(q.id)).length;
  const structAnsweredCount = structuredQuestions.filter((q: any) => isStructAnswered(q.id)).length;
  const allAnswered = mcqAnsweredCount === mcqQuestions.length && structAnsweredCount === structuredQuestions.length;

  const handleScanUpload = async (qId: number, file: File) => {
    setScanUploads(prev => ({ ...prev, [qId]: { questionId: qId, file, uploading: true, uploaded: false } }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classId", String(studentInfo?.classId ?? 1));
      formData.append("description", `Scan for question ${qId}, test ${testId}`);
      const res = await fetch(`${base}api/uploads`, { method: "POST", body: formData });
      if (res.ok) {
        setScanUploads(prev => ({ ...prev, [qId]: { ...prev[qId]!, uploading: false, uploaded: true } }));
      } else {
        setScanUploads(prev => ({ ...prev, [qId]: { ...prev[qId]!, uploading: false } }));
      }
    } catch {
      setScanUploads(prev => ({ ...prev, [qId]: { ...prev[qId]!, uploading: false } }));
    }
  };

  const handleSubmit = async () => {
    if (!studentCode) return;
    const mcqList = Object.entries(mcqAnswers).map(([qId, ans]) => ({
      questionId: Number(qId),
      answer: ans as "A" | "B" | "C" | "D",
    }));
    const extendedAnswers = Object.entries(structuredAnswers).map(([qId, txt]) => ({
      questionId: Number(qId),
      structuredAnswer: txt,
    }));

    const allAnswersList = [
      ...mcqList,
      // Add placeholder answers for structured questions that only have scans
      ...structuredQuestions
        .filter((q: any) => !mcqAnswers[q.id] && !structuredAnswers[q.id] && scanUploads[q.id]?.uploaded)
        .map((q: any) => ({ questionId: q.id, answer: "A" as const })),
    ];

    submitMut.mutate(
      {
        testId,
        data: {
          studentCode,
          answers: allAnswersList.length > 0 ? allAnswersList : [{ questionId: -1, answer: "A" as const }],
          ...(extendedAnswers.length > 0 ? { extendedAnswers } : {}),
        } as any,
      },
      { onSuccess: res => setResult(res) }
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-32 animate-in fade-in duration-500">
      {/* Sticky header */}
      <div className="bg-card border border-border p-4 rounded-3xl shadow-sm flex items-center justify-between sticky top-4 z-10 mb-8 gap-3">
        <div>
          <h1 className="text-lg font-display font-bold text-foreground">{test.title}</h1>
          <p className="text-xs text-muted-foreground font-medium">
            {studentInfo?.studentName ?? studentCode}
            {studentInfo?.className ? ` · ${studentInfo.className}` : ""}
          </p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm shrink-0 ${timeWarning ? "bg-red-100 text-red-700 animate-pulse" : "bg-secondary text-foreground"}`}>
            <Clock className="w-4 h-4" />{formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Section Tabs */}
      {(hasMcq || hasStructured) && (
        <div className="flex gap-2 mb-8">
          {hasMcq && (
            <button
              onClick={() => setActiveTab("mcq")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                activeTab === "mcq"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4" />
              MCQ Questions
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === "mcq" ? "bg-white/20" : "bg-background"}`}>
                {mcqAnsweredCount}/{mcqQuestions.length}
              </span>
            </button>
          )}
          {hasStructured && (
            <button
              onClick={() => setActiveTab("structured")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                activeTab === "structured"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlignLeft className="w-4 h-4" />
              Written Questions
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === "structured" ? "bg-white/20" : "bg-background"}`}>
                {structAnsweredCount}/{structuredQuestions.length}
              </span>
            </button>
          )}
        </div>
      )}

      {/* MCQ Section */}
      {activeTab === "mcq" && hasMcq && (
        <div className="space-y-6">
          {mcqQuestions.map((q: any, idx: number) => {
            const isAnswered = isMcqAnswered(q.id);
            return (
              <Card key={q.id} className={`overflow-hidden transition-all ${isAnswered ? "ring-2 ring-emerald-500/30" : ""}`}>
                <div className="flex items-center justify-between px-6 py-3 bg-secondary/50 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">MCQ</span>
                    {isAnswered && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{q.points} pts</span>
                </div>
                <CardContent className="p-6">
                  <p className="font-medium text-foreground mb-6">{q.questionText}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(["A", "B", "C", "D"] as const).map(opt => {
                      const optionText = (q as any)[`option${opt}`];
                      if (!optionText) return null;
                      const isSelected = mcqAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setMcqAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className={`text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                            isSelected ? "border-primary bg-primary/5 shadow" : "border-border/50 hover:border-border"
                          }`}
                        >
                          <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground"
                          }`}>{opt}</div>
                          <span className={`font-medium text-sm pt-0.5 ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                            {optionText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Structured Section */}
      {activeTab === "structured" && hasStructured && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-sm text-indigo-800 font-medium">
            <AlignLeft className="w-5 h-5 shrink-0" />
            Written questions are marked by your teacher. You can type your answer or upload a scan of handwritten work.
          </div>

          {structuredQuestions.map((q: any, idx: number) => {
            const isAnswered = isStructAnswered(q.id);
            const scan = scanUploads[q.id];
            return (
              <Card key={q.id} className={`overflow-hidden transition-all border-indigo-200 ${isAnswered ? "ring-2 ring-emerald-500/30" : ""}`}>
                <div className="flex items-center justify-between px-6 py-3 bg-indigo-50 border-b border-indigo-200">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Written</span>
                    {isAnswered && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">{q.points} pts</span>
                </div>
                <CardContent className="p-6 space-y-4">
                  <p className="font-medium text-foreground">{q.questionText}</p>

                  <textarea
                    value={structuredAnswers[q.id] ?? ""}
                    onChange={e => setStructuredAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    rows={5}
                    placeholder="Type your answer here..."
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none transition-colors"
                  />

                  {/* Upload Scan */}
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all ${
                      scan?.uploaded
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : scan?.uploading
                        ? "bg-secondary text-muted-foreground cursor-not-allowed"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                    }`}>
                      {scan?.uploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                      ) : scan?.uploaded ? (
                        <><CheckCircle2 className="w-4 h-4" /> Scan Uploaded</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Upload Scan</>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={scan?.uploading || scan?.uploaded}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleScanUpload(q.id, file);
                        }}
                      />
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {scan?.uploaded ? `File: ${scan.file?.name}` : "Upload a photo or scan of your handwritten work"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* If only one section exists and it's the other tab */}
      {activeTab === "mcq" && !hasMcq && (
        <div className="text-center p-16 text-muted-foreground">
          <p className="font-medium">No MCQ questions in this test.</p>
          {hasStructured && <button className="text-indigo-600 font-bold mt-2 hover:underline" onClick={() => setActiveTab("structured")}>Go to Written Questions →</button>}
        </div>
      )}
      {activeTab === "structured" && !hasStructured && (
        <div className="text-center p-16 text-muted-foreground">
          <p className="font-medium">No written questions in this test.</p>
          {hasMcq && <button className="text-primary font-bold mt-2 hover:underline" onClick={() => setActiveTab("mcq")}>Go to MCQ Questions →</button>}
        </div>
      )}

      {/* Bottom submit bar */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background/90 backdrop-blur-md border-t border-border flex items-center justify-between z-20 gap-4">
        <div className="text-sm font-semibold text-muted-foreground">
          {allAnswered
            ? <span className="text-emerald-600 font-bold">✓ All questions answered — ready to submit</span>
            : <span>{test.questions.length - mcqAnsweredCount - structAnsweredCount} questions remaining</span>
          }
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || submitMut.isPending}
          className="h-12 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25"
        >
          {submitMut.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Test"}
        </Button>
      </div>
    </div>
  );
}
