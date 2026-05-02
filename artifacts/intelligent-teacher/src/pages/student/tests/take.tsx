import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetTest, useSubmitTestAnswers } from "@workspace/api-client-react";
import { useStudent } from "@/context/StudentContext";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Clock, FileText, AlignLeft,
  ChevronLeft, ChevronRight, Lock, Upload, Loader2,
  Send, AlertCircle, ArrowLeft,
} from "lucide-react";

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

  const { data: test, isLoading } = useGetTest(testId, { query: { enabled: !!testId && !isNaN(testId) } });
  const submitMut = useSubmitTestAnswers();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [structuredAnswers, setStructuredAnswers] = useState<Record<number, string>>({});
  const [scanUploads, setScanUploads] = useState<Record<number, ScanUpload>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submissionLock, setSubmissionLock] = useState<any>(null);
  const [lockLoading, setLockLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const base = import.meta.env.BASE_URL;

  useEffect(() => { if (!studentCode) setLocation("/student"); }, [studentCode]);

  useEffect(() => {
    if (!testId || !studentCode) return;
    fetch(`${base}api/tests/${testId}/submission-status?studentCode=${encodeURIComponent(studentCode)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSubmissionLock(d); })
      .finally(() => setLockLoading(false));
  }, [testId, studentCode]);

  useEffect(() => {
    if (test && timeLeft === null) setTimeLeft(test.durationMinutes * 60);
  }, [test]);

  useEffect(() => {
    if (timeLeft === null || submissionLock?.submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timeLeft !== null, submissionLock?.submitted]);

  if (isLoading || lockLoading) return <LoadingScreen />;

  if (!test) return (
    <div className="max-w-lg mx-auto mt-24 text-center">
      <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
      <Button onClick={() => setLocation("/student/tests")}>Back to Tests</Button>
    </div>
  );

  const allQuestions: any[] = test.questions;
  const totalQ = allQuestions.length;

  const isAnswered = (q: any) => {
    if ((q.questionType ?? "mcq") === "mcq") return !!answers[q.id];
    return (structuredAnswers[q.id] ?? "").trim().length > 0 || scanUploads[q.id]?.uploaded;
  };

  const answeredCount = allQuestions.filter(isAnswered).length;
  const progressPct = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;

  // ── Already submitted ─────────────────────────────────────────────────────
  if (submissionLock?.submitted) {
    const r = submissionLock.result;
    const pct = r?.percentage ?? 0;
    const passed = pct >= 60;
    return (
      <div className="max-w-2xl mx-auto mt-10 animate-in zoom-in-95 duration-500">
        <Card className="rounded-[2rem] overflow-hidden shadow-2xl">
          <div className={`h-3 w-full ${passed ? "bg-emerald-500" : "bg-orange-400"}`} />
          <CardContent className="p-10 text-center">
            <Lock className="w-14 h-14 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-3xl font-display font-bold mb-2">Already Submitted</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">This test is locked. You've already submitted and can't re-take it.</p>
            {r && (
              <div className={`inline-block rounded-3xl px-10 py-6 mb-8 ${passed ? "bg-emerald-50 border border-emerald-200" : "bg-orange-50 border border-orange-200"}`}>
                <p className={`text-6xl font-black mb-1 ${passed ? "text-emerald-600" : "text-orange-500"}`}>{pct}%</p>
                <p className="font-bold text-muted-foreground">{r.earnedPoints} / {r.totalPoints} pts</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              {r && (
                <Button variant="outline" className="rounded-xl" onClick={() => setLocation(`/student/results/${r.id}`)}>
                  View Detailed Results
                </Button>
              )}
              <Button className="rounded-xl" onClick={() => setLocation("/student/tests")}>Back to Tests</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const timeWarning = timeLeft !== null && timeLeft < 120;
  const currentQ = allQuestions[currentIdx];

  const handleScanUpload = async (qId: number, file: File) => {
    setScanUploads(prev => ({ ...prev, [qId]: { questionId: qId, file, uploading: true, uploaded: false } }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classId", String(studentInfo?.classId ?? 1));
      formData.append("description", `Scan Q${qId} test ${testId}`);
      const res = await fetch(`${base}api/uploads`, { method: "POST", body: formData });
      setScanUploads(prev => ({ ...prev, [qId]: { ...prev[qId]!, uploading: false, uploaded: res.ok } }));
    } catch {
      setScanUploads(prev => ({ ...prev, [qId]: { ...prev[qId]!, uploading: false } }));
    }
  };

  const handleSubmit = async () => {
    if (!studentCode) return;
    const mcqList = Object.entries(answers).map(([qId, ans]) => ({ questionId: Number(qId), answer: ans as any }));
    const extendedAnswers = Object.entries(structuredAnswers).map(([qId, txt]) => ({ questionId: Number(qId), structuredAnswer: txt }));
    const allAnswersList = [...mcqList, ...allQuestions.filter((q: any) => !answers[q.id] && !structuredAnswers[q.id] && scanUploads[q.id]?.uploaded).map((q: any) => ({ questionId: q.id }))];

    submitMut.mutate(
      { testId, data: { studentCode, answers: allAnswersList.length > 0 ? allAnswersList : [{ questionId: -1 }], ...(extendedAnswers.length > 0 ? { extendedAnswers } : {}) } as any },
      { onSuccess: res => setLocation(`/student/results/${(res as any).id}`) }
    );
  };

  const isMcq = (q: any) => (q.questionType ?? "mcq") === "mcq";

  return (
    <div className="max-w-3xl mx-auto pb-28 animate-in fade-in duration-300">

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border pb-4 pt-2 mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setLocation("/student/tests")}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Exit
            </button>
            <div className="w-px h-5 bg-border shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg font-display font-bold text-foreground truncate">{test.title}</h1>
              <p className="text-xs text-muted-foreground font-medium">{studentInfo?.studentName ?? studentCode}{studentInfo?.className ? ` · ${studentInfo.className}` : ""}</p>
            </div>
          </div>
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm shrink-0 transition-colors ${timeWarning ? "bg-red-100 text-red-700 animate-pulse" : "bg-secondary text-foreground"}`}>
              <Clock className="w-4 h-4" />{formatTime(timeLeft)}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-muted-foreground shrink-0 w-16 text-right">
            {answeredCount}/{totalQ} done
          </span>
        </div>
      </div>

      {/* ── Question navigator ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-secondary/30 rounded-2xl border border-border">
        <p className="w-full text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Question Navigator</p>
        {allQuestions.map((q: any, idx: number) => {
          const answered = isAnswered(q);
          const isCurrent = idx === currentIdx;
          const isM = isMcq(q);
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all border-2 ${
                isCurrent
                  ? isM ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                         : "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25"
                  : answered
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* ── Current question ───────────────────────────────────────────────── */}
      {currentQ && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200" key={currentQ.id}>
          <Card className={`overflow-hidden border-2 ${isMcq(currentQ) ? "border-primary/20" : "border-indigo-300/50"}`}>
            {/* Question header */}
            <div className={`flex items-center justify-between px-6 py-3 border-b ${isMcq(currentQ) ? "bg-primary/5 border-primary/10" : "bg-indigo-50 border-indigo-200"}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${isMcq(currentQ) ? "bg-primary text-primary-foreground" : "bg-indigo-600 text-white"}`}>
                  {currentIdx + 1}
                </div>
                <div className="flex items-center gap-1.5">
                  {isMcq(currentQ)
                    ? <><FileText className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-bold text-primary uppercase tracking-wider">Multiple Choice</span></>
                    : <><AlignLeft className="w-3.5 h-3.5 text-indigo-600" /><span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Written Answer</span></>
                  }
                </div>
                {isAnswered(currentQ) && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isMcq(currentQ) ? "bg-primary/10 text-primary" : "bg-indigo-100 text-indigo-700"}`}>
                {currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}
              </span>
            </div>

            <CardContent className="p-6">
              <p className="font-medium text-foreground mb-6 text-lg leading-relaxed">{currentQ.questionText}</p>

              {/* MCQ options */}
              {isMcq(currentQ) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(["A", "B", "C", "D"] as const).map(opt => {
                    const optText = (currentQ as any)[`option${opt}`];
                    if (!optText) return null;
                    const isSelected = answers[currentQ.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt }))}
                        className={`text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                          isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border/50 hover:border-primary/40 hover:bg-secondary/30"
                        }`}
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground"
                        }`}>{opt}</div>
                        <span className={`font-medium text-sm pt-1 ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{optText}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Written answer */}
              {!isMcq(currentQ) && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-800 font-medium flex items-start gap-2">
                    <AlignLeft className="w-4 h-4 shrink-0 mt-0.5" />
                    Type your answer below, or upload a scan of handwritten work.
                  </div>
                  <textarea
                    value={structuredAnswers[currentQ.id] ?? ""}
                    onChange={e => setStructuredAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
                    rows={6}
                    placeholder="Write your answer here..."
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none"
                  />
                  <div className="flex items-center gap-3 pt-1 border-t border-border">
                    {(() => {
                      const scan = scanUploads[currentQ.id];
                      return (
                        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all ${
                          scan?.uploaded ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : scan?.uploading ? "bg-secondary text-muted-foreground cursor-not-allowed"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                        }`}>
                          {scan?.uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                           : scan?.uploaded ? <><CheckCircle2 className="w-4 h-4" /> Scan Uploaded</>
                           : <><Upload className="w-4 h-4" /> Upload Scan</>}
                          <input type="file" accept="image/*,.pdf" className="hidden" disabled={scan?.uploading || scan?.uploaded}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleScanUpload(currentQ.id, f); }} />
                        </label>
                      );
                    })()}
                    <span className="text-xs text-muted-foreground">{scanUploads[currentQ.id]?.uploaded ? `File: ${scanUploads[currentQ.id]?.file?.name}` : "Photo or PDF of handwritten work"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" className="rounded-xl gap-2" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}>
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <span className="text-sm font-semibold text-muted-foreground">{currentIdx + 1} / {totalQ}</span>
            {currentIdx < totalQ - 1 ? (
              <Button variant="outline" className="rounded-xl gap-2" onClick={() => setCurrentIdx(i => Math.min(totalQ - 1, i + 1))}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowConfirm(true)}>
                <Send className="w-4 h-4" /> Review & Submit
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Submit confirmation overlay ────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md p-8 z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-display font-bold mb-2">Ready to submit?</h3>
            <p className="text-muted-foreground mb-6 text-sm">This is final — you cannot re-take this test once submitted.</p>

            {/* Summary */}
            <div className="bg-secondary/50 rounded-2xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">Total questions</span>
                <span>{totalQ}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-emerald-600">Answered</span>
                <span className="text-emerald-600">{answeredCount}</span>
              </div>
              {answeredCount < totalQ && (
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-amber-600">Unanswered</span>
                  <span className="text-amber-600">{totalQ - answeredCount}</span>
                </div>
              )}
            </div>

            {answeredCount < totalQ && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-sm text-amber-800 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                You have {totalQ - answeredCount} unanswered question{totalQ - answeredCount !== 1 ? "s" : ""}. These will receive 0 marks.
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowConfirm(false)}>
                Go Back
              </Button>
              <Button
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={handleSubmit}
                disabled={submitMut.isPending}
              >
                {submitMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Now</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/90 backdrop-blur-md border-t border-border px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground mb-1">
            {answeredCount === totalQ
              ? <span className="text-emerald-600">All questions answered!</span>
              : <span>{totalQ - answeredCount} question{totalQ - answeredCount !== 1 ? "s" : ""} remaining</span>
            }
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={submitMut.isPending}
          className="shrink-0 h-11 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
        >
          <Send className="w-4 h-4 mr-2" /> Submit
        </Button>
      </div>
    </div>
  );
}
