import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetTest, useSubmitTestAnswers } from "@workspace/api-client-react";
import { useStudent } from "@/context/StudentContext";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, List, AlignLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { TestResult } from "@workspace/api-client-react";

type QuestionMode = "mcq" | "structured";
type ViewMode = "all" | "one-by-one";

export default function TakeTest() {
  const [params] = useRoute("/student/tests/:id");
  const testId = Number(params?.id);

  const { studentCode } = useStudent();
  const [, setLocation] = useLocation();

  const { data: test, isLoading } = useGetTest(testId, { query: { enabled: !!testId } });
  const submitMut = useSubmitTestAnswers();

  const [mcqAnswers, setMcqAnswers] = useState<Record<number, string>>({});
  const [structuredAnswers, setStructuredAnswers] = useState<Record<number, string>>({});
  const [questionModes, setQuestionModes] = useState<Record<number, QuestionMode>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!studentCode) setLocation("/student");
  }, [studentCode, setLocation]);

  useEffect(() => {
    if (test && timeLeft === null) {
      setTimeLeft(test.durationMinutes * 60);
    }
  }, [test]);

  useEffect(() => {
    if (timeLeft === null || result) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timeLeft !== null, !!result]);

  if (isLoading) return <LoadingScreen />;
  if (!test) return (
    <div className="max-w-lg mx-auto mt-24 text-center">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Test Not Found</h2>
      <p className="text-muted-foreground mb-6">This test doesn't exist or has been removed.</p>
      <Button onClick={() => setLocation("/student/tests")}>Back to Tests</Button>
    </div>
  );

  if (result) {
    const passed = result.percentage >= 60;
    return (
      <div className="max-w-2xl mx-auto text-center mt-12 animate-in zoom-in-95 duration-500">
        <Card className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className={`h-4 w-full ${passed ? "bg-emerald-500" : "bg-orange-400"}`} />
          <CardContent className="p-12">
            <CheckCircle2 className={`w-24 h-24 mx-auto mb-6 ${passed ? "text-emerald-500" : "text-orange-400"}`} />
            <h2 className="text-4xl font-display font-extrabold text-foreground mb-6">Test Submitted!</h2>
            <div className="inline-block bg-secondary rounded-3xl p-8 mb-8">
              <div className={`text-7xl font-black mb-2 ${passed ? "text-emerald-600" : "text-orange-500"}`}>
                {result.percentage}%
              </div>
              <p className="text-lg font-bold text-muted-foreground">
                Score: {result.earnedPoints} / {result.totalPoints} pts
              </p>
              {!passed && (
                <p className="text-sm text-orange-600 mt-2 font-medium">
                  Keep practicing — you'll get it next time!
                </p>
              )}
            </div>
            <Button onClick={() => setLocation("/student/tests")} className="h-14 px-10 rounded-xl text-lg w-full max-w-xs">
              Back to My Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getQuestionMode = (qId: number): QuestionMode => {
    return questionModes[qId] ?? "mcq";
  };

  const toggleQuestionMode = (qId: number) => {
    setQuestionModes(prev => ({
      ...prev,
      [qId]: prev[qId] === "structured" ? "mcq" : "structured",
    }));
  };

  const handleMcqSelect = (qId: number, opt: string) => {
    setMcqAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const handleStructuredChange = (qId: number, text: string) => {
    setStructuredAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const isQuestionAnswered = (qId: number) => {
    const mode = getQuestionMode(qId);
    if (mode === "mcq") return !!mcqAnswers[qId];
    return (structuredAnswers[qId] ?? "").trim().length > 0;
  };

  const allAnswered = test.questions.every(q => isQuestionAnswered(q.id));
  const answeredCount = test.questions.filter(q => isQuestionAnswered(q.id)).length;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSubmit = () => {
    if (!studentCode) return;
    const mcqList = Object.entries(mcqAnswers).map(([qId, ans]) => ({
      questionId: Number(qId),
      answer: ans as "A" | "B" | "C" | "D",
    }));

    submitMut.mutate(
      {
        testId,
        data: {
          studentCode,
          answers: mcqList.length > 0 ? mcqList : [{ questionId: -1, answer: "A" as const }],
          ...(Object.keys(structuredAnswers).length > 0 ? {
            extendedAnswers: Object.entries(structuredAnswers).map(([qId, txt]) => ({
              questionId: Number(qId),
              structuredAnswer: txt,
            })),
          } : {}),
        } as any,
      },
      { onSuccess: res => setResult(res) }
    );
  };

  const questions = test.questions;
  const displayedQuestions = viewMode === "one-by-one" ? [questions[currentIdx]!] : questions;

  const timeWarning = timeLeft !== null && timeLeft < 120;

  return (
    <div className="max-w-3xl mx-auto pb-32 animate-in fade-in duration-500">
      {/* Sticky Header */}
      <div className="bg-card border border-border p-5 rounded-3xl shadow-sm flex items-center justify-between sticky top-4 z-10 mb-8 gap-4">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground leading-tight">{test.title}</h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {answeredCount} / {questions.length} answered
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="hidden sm:flex bg-secondary rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${viewMode === "all" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="w-3.5 h-3.5" /> All
            </button>
            <button
              onClick={() => setViewMode("one-by-one")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${viewMode === "one-by-one" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <AlignLeft className="w-3.5 h-3.5" /> Step-by-step
            </button>
          </div>

          {/* Timer */}
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm ${timeWarning ? "bg-red-100 text-red-700 animate-pulse" : "bg-secondary text-foreground"}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      {/* One-by-one navigation */}
      {viewMode === "one-by-one" && (
        <div className="flex items-center justify-between mb-4 px-1">
          <Button
            variant="outline"
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <div className="flex gap-1.5">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                  i === currentIdx ? "bg-accent text-accent-foreground" :
                  isQuestionAnswered(q.id) ? "bg-emerald-500/20 text-emerald-700" :
                  "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
            disabled={currentIdx === questions.length - 1}
            className="rounded-xl"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-8">
        {displayedQuestions.map((q, idx) => {
          const globalIdx = viewMode === "one-by-one" ? currentIdx : idx;
          const mode = getQuestionMode(q.id);
          const answered = isQuestionAnswered(q.id);

          return (
            <Card key={q.id} className={`border-border shadow-sm rounded-2xl overflow-hidden transition-all ${answered ? "ring-2 ring-emerald-500/20" : ""}`}>
              <div className="bg-secondary/50 px-6 py-4 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider text-sm">
                    Question {globalIdx + 1}
                  </span>
                  {answered && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg text-sm">
                    {q.points} pts
                  </span>
                  {/* Question type toggle */}
                  <div className="flex bg-background border border-border rounded-lg p-0.5 text-xs font-semibold">
                    <button
                      onClick={() => mode !== "mcq" && toggleQuestionMode(q.id)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${mode === "mcq" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      MCQ
                    </button>
                    <button
                      onClick={() => mode !== "structured" && toggleQuestionMode(q.id)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${mode === "structured" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Written
                    </button>
                  </div>
                </div>
              </div>

              <CardContent className="p-8">
                <p className="text-lg font-medium text-foreground mb-8">{q.questionText}</p>

                {mode === "mcq" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(["A", "B", "C", "D"] as const).map(opt => {
                      const optionText = (q as any)[`option${opt}`];
                      if (!optionText) return null;
                      const isSelected = mcqAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleMcqSelect(q.id, opt)}
                          className={`text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? "border-accent bg-accent/5 shadow-md"
                              : "border-border/50 bg-secondary/20 hover:border-border hover:bg-secondary/50"
                          }`}
                        >
                          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isSelected ? "bg-accent text-accent-foreground" : "bg-background border border-border text-muted-foreground"
                          }`}>
                            {opt}
                          </div>
                          <span className={`font-medium pt-1 ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                            {optionText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-medium">
                      Write your answer in the box below. Be as detailed as needed.
                    </p>
                    <textarea
                      value={structuredAnswers[q.id] ?? ""}
                      onChange={e => handleStructuredChange(q.id, e.target.value)}
                      rows={6}
                      placeholder="Type your answer here..."
                      className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none transition-colors"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {(structuredAnswers[q.id] ?? "").length} characters
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-md border-t border-border flex items-center justify-between z-20 gap-4">
        <div className="text-sm font-semibold text-muted-foreground">
          {allAnswered ? (
            <span className="text-emerald-600 font-bold">✓ All questions answered</span>
          ) : (
            <span>{questions.length - answeredCount} questions remaining</span>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || submitMut.isPending}
          className="h-14 px-12 rounded-2xl text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/25"
        >
          {submitMut.isPending ? "Submitting..." : "Submit Test"}
        </Button>
      </div>
    </div>
  );
}
