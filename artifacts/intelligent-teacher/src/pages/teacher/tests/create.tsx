import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateTest, useGetClasses } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save } from "lucide-react";

export default function CreateTest() {
  const [, setLocation] = useLocation();
  const { data: classes } = useGetClasses();
  const createMut = useCreateTest();

  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [duration, setDuration] = useState("30");
  const [questions, setQuestions] = useState([
    { questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A" as const, points: 1 }
  ]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", points: 1 }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleChange = (idx: number, field: string, value: string | number) => {
    const newQ = [...questions];
    (newQ[idx] as any)[field] = value;
    setQuestions(newQ);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      data: {
        title,
        classId: Number(classId),
        durationMinutes: Number(duration),
        questions
      }
    }, {
      onSuccess: () => setLocation("/tests")
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">Create Test</h1>
        <p className="text-lg text-muted-foreground mt-2 font-medium">Build a new multiple choice assessment.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border-primary/20 shadow-md">
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-foreground uppercase tracking-wider">Test Title</label>
              <Input required value={title} onChange={e => setTitle(e.target.value)} className="h-14 text-lg rounded-xl" placeholder="e.g. Midterm Physics Exam" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground uppercase tracking-wider">Target Class</label>
              <select 
                required
                className="flex h-14 w-full rounded-xl border border-input bg-background px-4 py-2 font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                value={classId}
                onChange={e => setClassId(e.target.value)}
              >
                <option value="" disabled>Select Class</option>
                {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground uppercase tracking-wider">Duration (Minutes)</label>
              <Input required type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="h-14 rounded-xl" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-2xl font-display font-bold">Questions</h2>
             <span className="font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full">{questions.length} Total</span>
          </div>

          {questions.map((q, idx) => (
            <Card key={idx} className="relative overflow-hidden shadow-sm border-border">
              <div className="absolute top-0 left-0 bottom-0 w-2 bg-indigo-200" />
              <CardContent className="p-8 pl-10 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Question {idx + 1}</label>
                    <textarea 
                      required 
                      rows={2}
                      className="flex w-full rounded-xl border border-input bg-background px-4 py-3 font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                      placeholder="Enter question text here..."
                      value={q.questionText}
                      onChange={e => handleChange(idx, 'questionText', e.target.value)}
                    />
                  </div>
                  {questions.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => handleRemoveQuestion(idx)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <div key={opt} className="flex items-center gap-3 bg-secondary/30 p-2 rounded-xl border border-border/50">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background border border-border font-bold text-muted-foreground shrink-0">{opt}</div>
                      <Input 
                        required 
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
                      onChange={e => handleChange(idx, 'correctAnswer', e.target.value)}
                    >
                      {['A', 'B', 'C', 'D'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-bold text-foreground">Points:</label>
                    <Input 
                      type="number" min="1" className="w-24 h-10 rounded-lg"
                      value={q.points}
                      onChange={e => handleChange(idx, 'points', Number(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={handleAddQuestion} className="w-full h-14 rounded-xl border-dashed border-2 text-primary font-bold hover:bg-primary/5">
          <Plus className="w-5 h-5 mr-2" /> Add Another Question
        </Button>

        <div className="fixed bottom-0 left-0 md:left-64 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border flex justify-end z-20">
          <Button type="submit" disabled={createMut.isPending} className="h-14 px-10 rounded-xl shadow-xl shadow-primary/20 text-lg">
            <Save className="w-5 h-5 mr-2" />
            {createMut.isPending ? "Saving Test..." : "Save Test & Publish"}
          </Button>
        </div>
      </form>
    </div>
  );
}
