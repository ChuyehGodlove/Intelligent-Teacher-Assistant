import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateTest, useGetClasses } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, FileText, AlignLeft, ChevronDown, ChevronUp } from "lucide-react";

type QuestionType = "mcq" | "structured";

interface QuestionDraft {
  questionText: string;
  questionType: QuestionType;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  modelAnswer: string;
  points: number;
}

const defaultQuestion = (): QuestionDraft => ({
  questionText: "",
  questionType: "mcq",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  modelAnswer: "",
  points: 1,
});

export default function CreateTest() {
  const [, setLocation] = useLocation();
  const { data: classes } = useGetClasses();
  const createMut = useCreateTest();

  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [duration, setDuration] = useState("30");
  const [questions, setQuestions] = useState<QuestionDraft[]>([defaultQuestion()]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const toggleExpanded = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleAddQuestion = (type: QuestionType) => {
    const idx = questions.length;
    setQuestions([...questions, { ...defaultQuestion(), questionType: type }]);
    setExpanded(prev => new Set([...prev, idx]));
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
    setExpanded(prev => {
      const next = new Set<number>();
      prev.forEach(i => { if (i !== idx) next.add(i > idx ? i - 1 : i); });
      return next;
    });
  };

  const handleChange = (idx: number, field: string, value: string | number) => {
    const newQ = [...questions];
    (newQ[idx] as any)[field] = value;
    setQuestions(newQ);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(
      {
        data: {
          title,
          classId: Number(classId),
          durationMinutes: Number(duration),
          questions: questions.map(q => ({
            questionText: q.questionText,
            questionType: q.questionType,
            optionA: q.questionType === "mcq" ? q.optionA : undefined,
            optionB: q.questionType === "mcq" ? q.optionB : undefined,
            optionC: q.questionType === "mcq" ? q.optionC : undefined,
            optionD: q.questionType === "mcq" ? q.optionD : undefined,
            correctAnswer: q.questionType === "mcq" ? q.correctAnswer : undefined,
            modelAnswer: q.questionType === "structured" ? q.modelAnswer : undefined,
            points: q.points,
          })) as any,
        },
      },
      { onSuccess: () => setLocation("/tests") }
    );
  };

  const mcqCount = questions.filter(q => q.questionType === "mcq").length;
  const structuredCount = questions.filter(q => q.questionType === "structured").length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <div>
        <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">Create Test</h1>
        <p className="text-lg text-muted-foreground mt-2 font-medium">
          Build a new assessment with MCQ and/or structured questions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Test Info */}
        <Card className="border-primary/20 shadow-md">
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-foreground uppercase tracking-wider">Test Title</label>
              <Input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-14 text-lg rounded-xl"
                placeholder="e.g. Midterm Physics Exam"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground uppercase tracking-wider">Target Class</label>
              <select
                required
                className="flex h-14 w-full rounded-xl border border-input bg-background px-4 py-2 font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={classId}
                onChange={e => setClassId(e.target.value)}
              >
                <option value="" disabled>Select Class</option>
                {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground uppercase tracking-wider">Duration (minutes)</label>
              <Input
                required
                type="number"
                min="1"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="h-14 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Question summary */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">Questions</h2>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {mcqCount} MCQ · {structuredCount} Written · {questions.length} total
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card
              key={idx}
              className={`overflow-hidden border-2 transition-colors ${
                q.questionType === "mcq" ? "border-primary/20" : "border-indigo-300/50"
              }`}
            >
              {/* Question header */}
              <div
                className={`flex items-center justify-between px-6 py-4 cursor-pointer ${
                  q.questionType === "mcq" ? "bg-primary/5" : "bg-indigo-50"
                }`}
                onClick={() => toggleExpanded(idx)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    q.questionType === "mcq"
                      ? "bg-primary text-primary-foreground"
                      : "bg-indigo-600 text-white"
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {q.questionType === "mcq" ? (
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        q.questionType === "mcq" ? "text-primary" : "text-indigo-600"
                      }`}>
                        {q.questionType === "mcq" ? "Multiple Choice" : "Structured / Written"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-0.5 max-w-md truncate">
                      {q.questionText || "No question text yet..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-background border border-border px-3 py-1 rounded-full">
                    {q.points} pt{q.points !== 1 ? "s" : ""}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleRemoveQuestion(idx); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {expanded.has(idx) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Question body (collapsible) */}
              {expanded.has(idx) && (
                <CardContent className="p-8 space-y-6">
                  {/* Type toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">Question Type:</span>
                    <div className="flex bg-secondary rounded-xl p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => handleChange(idx, "questionType", "mcq")}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          q.questionType === "mcq"
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" /> MCQ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange(idx, "questionType", "structured")}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          q.questionType === "structured"
                            ? "bg-indigo-600 text-white shadow"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" /> Written
                      </button>
                    </div>
                  </div>

                  {/* Question text */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      Question Text
                    </label>
                    <textarea
                      required
                      rows={2}
                      className="flex w-full rounded-xl border border-input bg-background px-4 py-3 font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Enter your question here..."
                      value={q.questionText}
                      onChange={e => handleChange(idx, "questionText", e.target.value)}
                    />
                  </div>

                  {/* MCQ options */}
                  {q.questionType === "mcq" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(["A", "B", "C", "D"] as const).map(opt => (
                          <div key={opt} className="flex items-center gap-3 bg-secondary/30 p-2 rounded-xl border border-border/50">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background border border-border font-bold text-muted-foreground shrink-0">
                              {opt}
                            </div>
                            <Input
                              required={q.questionType === "mcq"}
                              className="h-10 border-0 bg-transparent focus-visible:ring-0 shadow-none px-0 font-medium"
                              placeholder={`Option ${opt}`}
                              value={(q as any)[`option${opt}`]}
                              onChange={e => handleChange(idx, `option${opt}`, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-6 pt-4 border-t border-border">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-bold text-foreground">Correct Answer:</label>
                          <select
                            className="h-10 rounded-lg border border-input bg-background px-3 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                            value={q.correctAnswer}
                            onChange={e => handleChange(idx, "correctAnswer", e.target.value)}
                          >
                            {["A", "B", "C", "D"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-bold text-foreground">Points:</label>
                          <Input
                            type="number" min="1"
                            className="w-24 h-10 rounded-lg"
                            value={q.points}
                            onChange={e => handleChange(idx, "points", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Structured question */}
                  {q.questionType === "structured" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                          Model Answer (for AI auditing)
                        </label>
                        <textarea
                          rows={4}
                          className="flex w-full rounded-xl border border-indigo-200 bg-indigo-50/50 px-4 py-3 font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                          placeholder="Describe the ideal answer. The AI will use this to assess student responses..."
                          value={q.modelAnswer}
                          onChange={e => handleChange(idx, "modelAnswer", e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          This model answer is visible only to you and used for AI-assisted marking.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-foreground">Max Points:</label>
                        <Input
                          type="number" min="1"
                          className="w-24 h-10 rounded-lg"
                          value={q.points}
                          onChange={e => handleChange(idx, "points", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Add question buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddQuestion("mcq")}
            className="h-14 rounded-xl border-dashed border-2 text-primary font-bold hover:bg-primary/5 border-primary/40"
          >
            <Plus className="w-5 h-5 mr-2" /> Add MCQ Question
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleAddQuestion("structured")}
            className="h-14 rounded-xl border-dashed border-2 text-indigo-600 font-bold hover:bg-indigo-50 border-indigo-300"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Written Question
          </Button>
        </div>

        <div className="fixed bottom-0 left-0 md:left-64 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border flex justify-end z-20">
          <Button
            type="submit"
            disabled={createMut.isPending}
            className="h-14 px-10 rounded-xl shadow-xl shadow-primary/20 text-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {createMut.isPending ? "Saving..." : "Save & Publish Test"}
          </Button>
        </div>
      </form>
    </div>
  );
}
