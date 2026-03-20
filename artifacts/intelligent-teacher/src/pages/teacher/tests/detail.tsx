import { useState } from "react";
import { useRoute } from "wouter";
import { useGetTest, useGetResults } from "@workspace/api-client-react";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LayoutList, Users, AlignLeft, FileText, Brain, Wrench, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

const AI_LABELS: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  correct: { label: "Correct", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle, desc: "Student answered correctly." },
  procedural_error: { label: "Procedural Error", color: "text-orange-700 bg-orange-50 border-orange-200", icon: Wrench, desc: "Student understood the concept but made procedural mistakes." },
  conceptual_error: { label: "Conceptual Error", color: "text-red-700 bg-red-50 border-red-200", icon: Brain, desc: "Student has a fundamental gap in understanding of this concept." },
  ungraded: { label: "Ungraded", color: "text-muted-foreground bg-secondary border-border", icon: AlertTriangle, desc: "Not yet marked by teacher." },
};

type Tab = "submissions" | "mark" | "questions";

export default function TestDetail() {
  const [params] = useRoute("/tests/:id");
  const testId = Number(params?.id);
  const [activeTab, setActiveTab] = useState<Tab>("submissions");
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [markingState, setMarkingState] = useState<Record<number, { marks: string; comment: string; saving: boolean; saved: boolean; aiCategory?: string }>>({});

  const { data: test, isLoading: testLoading } = useGetTest(testId);
  const { data: results, isLoading: resultsLoading, refetch: refetchResults } = useGetResults({ testId });

  const base = import.meta.env.BASE_URL;

  const loadAnswers = async (resultId: number) => {
    setSelectedResultId(resultId);
    setLoadingAnswers(true);
    try {
      const res = await fetch(`${base}api/results/${resultId}/answers`);
      if (res.ok) {
        const data = await res.json();
        setAnswers(data.answers ?? []);
        // Pre-fill marking state
        const init: any = {};
        for (const a of data.answers ?? []) {
          if (a.questionType === "structured") {
            init[a.answerId] = {
              marks: a.teacherMarks !== null && a.teacherMarks !== undefined ? String(a.teacherMarks) : "",
              comment: a.teacherComment ?? "",
              saving: false,
              saved: a.teacherMarks !== null,
              aiCategory: a.aiCategory,
            };
          }
        }
        setMarkingState(init);
      }
    } catch {}
    setLoadingAnswers(false);
  };

  const handleMark = async (answerId: number, resultId: number, maxPoints: number) => {
    const state = markingState[answerId];
    if (!state) return;
    const marks = parseFloat(state.marks);
    if (isNaN(marks) || marks < 0) return;

    setMarkingState(prev => ({ ...prev, [answerId]: { ...prev[answerId]!, saving: true } }));
    try {
      const res = await fetch(`${base}api/results/${resultId}/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answerId, marks, comment: state.comment }),
      });
      if (res.ok) {
        const data = await res.json();
        setMarkingState(prev => ({
          ...prev,
          [answerId]: { ...prev[answerId]!, saving: false, saved: true, aiCategory: data.aiCategory },
        }));
        // Update the local answers list
        setAnswers(prev => prev.map(a =>
          a.answerId === answerId ? { ...a, teacherMarks: marks, teacherComment: state.comment, aiCategory: data.aiCategory } : a
        ));
        refetchResults();
      }
    } catch {}
    setMarkingState(prev => ({ ...prev, [answerId]: { ...prev[answerId]!, saving: false } }));
  };

  if (testLoading || resultsLoading) return <LoadingScreen />;
  if (!test) return <div className="p-8 text-muted-foreground">Test not found.</div>;

  const hasStructured = test.questions.some((q: any) => (q.questionType ?? "mcq") === "structured");
  const structuredAnswers = answers.filter(a => a.questionType === "structured");
  const selectedResult = results?.find(r => r.id === selectedResultId);

  const tabs: { id: Tab; label: string; icon: any; show?: boolean }[] = [
    { id: "submissions", label: "Student Results", icon: Users },
    { id: "mark", label: "Mark Written", icon: AlignLeft, show: hasStructured },
    { id: "questions", label: "Questions Preview", icon: LayoutList },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Test header */}
      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
        <div className="inline-flex px-3 py-1 bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider rounded-full mb-3">
          Test #{test.id}
        </div>
        <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">{test.title}</h1>
        <div className="mt-5 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground">
            <LayoutList className="w-4 h-4" /> {test.questions.length} Questions
          </div>
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground">
            <Clock className="w-4 h-4" /> {test.durationMinutes} min
          </div>
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground">
            <Users className="w-4 h-4" /> {results?.length ?? 0} Submissions
          </div>
          {hasStructured && (
            <div className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-semibold">
              <AlignLeft className="w-4 h-4" /> Has Written Questions
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.filter(t => t.show !== false).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Student Results Tab */}
      {activeTab === "submissions" && (
        <Card className="shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Score</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Points</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Status</th>
                {hasStructured && (
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(!results || results.length === 0) && (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No submissions yet.</td></tr>
              )}
              {results?.map(r => (
                <tr key={r.id} className="hover:bg-secondary/20">
                  <td className="p-4">
                    <div className="font-bold">{r.studentName}</div>
                    <div className="text-xs text-muted-foreground">{r.studentCode}</div>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${
                      r.percentage >= 80 ? "bg-emerald-100 text-emerald-700" :
                      r.percentage >= 60 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>{r.percentage}%</span>
                  </td>
                  <td className="p-4 text-right text-muted-foreground font-medium">{r.earnedPoints} / {r.totalPoints}</td>
                  <td className="p-4 text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      (r as any).status === "submitted" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {(r as any).status ?? "submitted"}
                    </span>
                  </td>
                  {hasStructured && (
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() => { setActiveTab("mark"); loadAnswers(r.id); }}
                      >
                        Mark Written
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Mark Written Tab */}
      {activeTab === "mark" && hasStructured && (
        <div className="space-y-6">
          {/* Student selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-foreground">Select Student Submission:</label>
            <select
              className="h-10 rounded-xl border border-input bg-background px-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedResultId ?? ""}
              onChange={e => { if (e.target.value) loadAnswers(Number(e.target.value)); }}
            >
              <option value="">Choose a student...</option>
              {results?.map(r => (
                <option key={r.id} value={r.id}>{r.studentName} ({r.studentCode})</option>
              ))}
            </select>
            {selectedResult && (
              <span className="text-sm text-muted-foreground font-medium">
                Current total: {selectedResult.earnedPoints} / {selectedResult.totalPoints} pts
              </span>
            )}
          </div>

          {loadingAnswers && <LoadingScreen />}

          {!loadingAnswers && selectedResultId && structuredAnswers.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No written answers found for this submission.</div>
          )}

          {!loadingAnswers && structuredAnswers.map((answer: any) => {
            const ms = markingState[answer.answerId];
            const aiInfo = AI_LABELS[ms?.aiCategory ?? answer.aiCategory ?? "ungraded"] ?? AI_LABELS.ungraded;
            const AiIcon = aiInfo.icon;

            return (
              <Card key={answer.answerId} className="overflow-hidden border-indigo-200">
                <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-indigo-800 text-sm">Written Question · {answer.points} pts max</span>
                  </div>
                  {ms?.saved && (
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${aiInfo.color}`}>
                      <AiIcon className="w-3 h-3" />
                      AI: {aiInfo.label}
                    </div>
                  )}
                </div>
                <CardContent className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Question</p>
                    <p className="font-medium text-foreground">{answer.questionText}</p>
                  </div>

                  {answer.modelAnswer && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Model Answer</p>
                      <p className="text-sm text-emerald-800 font-medium">{answer.modelAnswer}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Student's Answer</p>
                    <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                      <p className="font-medium text-foreground whitespace-pre-wrap">
                        {answer.structuredAnswer || <span className="text-muted-foreground italic">No text answer provided</span>}
                      </p>
                    </div>
                  </div>

                  {/* Teacher marking */}
                  <div className="flex items-end gap-4 pt-2 border-t border-border">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Marks (out of {answer.points})</label>
                      <input
                        type="number"
                        min="0"
                        max={answer.points}
                        step="0.5"
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        value={ms?.marks ?? ""}
                        onChange={e => setMarkingState(prev => ({ ...prev, [answer.answerId]: { ...prev[answer.answerId]!, marks: e.target.value, saved: false } }))}
                      />
                    </div>
                    <div className="space-y-1.5 flex-[3]">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Teacher Comment (optional)</label>
                      <input
                        type="text"
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        placeholder="e.g. Good attempt but missed key formula..."
                        value={ms?.comment ?? ""}
                        onChange={e => setMarkingState(prev => ({ ...prev, [answer.answerId]: { ...prev[answer.answerId]!, comment: e.target.value, saved: false } }))}
                      />
                    </div>
                    <Button
                      onClick={() => handleMark(answer.answerId, selectedResultId!, answer.points)}
                      disabled={ms?.saving || !ms?.marks}
                      className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                    >
                      {ms?.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : ms?.saved ? <><CheckCircle className="w-4 h-4 mr-1" />Saved</> : "Save Marks"}
                    </Button>
                  </div>

                  {/* AI explanation */}
                  {ms?.saved && ms.aiCategory && ms.aiCategory !== "ungraded" && (
                    <div className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${aiInfo.color}`}>
                      <AiIcon className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">{aiInfo.label}</p>
                        <p className="text-xs opacity-80 mt-0.5">{aiInfo.desc}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Questions Preview Tab */}
      {activeTab === "questions" && (
        <div className="space-y-5">
          {test.questions.map((q: any, i: number) => {
            const isStructured = (q.questionType ?? "mcq") === "structured";
            return (
              <Card key={q.id} className={`shadow-sm ${isStructured ? "border-indigo-200" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isStructured
                        ? <span className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full"><AlignLeft className="w-3 h-3" />Written</span>
                        : <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full"><FileText className="w-3 h-3" />MCQ</span>
                      }
                      <span className="text-sm font-bold text-muted-foreground">Question {i + 1}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{q.points} pts</span>
                  </div>
                  <p className="font-medium text-foreground mb-4">{q.questionText}</p>
                  {!isStructured && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(["A", "B", "C", "D"] as const).map(opt => {
                        const txt = q[`option${opt}`];
                        if (!txt) return null;
                        const isCorrect = q.correctAnswer === opt;
                        return (
                          <div key={opt} className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium ${isCorrect ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-secondary/50 border border-border"}`}>
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? "bg-emerald-500 text-white" : "bg-background border border-border"}`}>{opt}</span>
                            {txt}
                            {isCorrect && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isStructured && q.modelAnswer && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
                      <span className="font-bold">Model Answer: </span>{q.modelAnswer}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
