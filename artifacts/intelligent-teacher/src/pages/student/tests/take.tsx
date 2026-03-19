import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetTest, useSubmitTestAnswers } from "@workspace/api-client-react";
import { useStudent } from "@/context/StudentContext";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";
import type { TestResult } from "@workspace/api-client-react";

export default function TakeTest() {
  const [params] = useRoute("/student/tests/:id");
  const testId = Number(params?.id);
  
  const { studentCode } = useStudent();
  const [, setLocation] = useLocation();

  const { data: test, isLoading } = useGetTest(testId, { query: { enabled: !!testId } });
  const submitMut = useSubmitTestAnswers();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    if (!studentCode) setLocation("/student");
  }, [studentCode, setLocation]);

  if (isLoading) return <LoadingScreen />;
  if (!test) return <div>Test not found</div>;

  if (result) {
    return (
       <div className="max-w-2xl mx-auto text-center mt-12 animate-in zoom-in-95 duration-500">
         <Card className="border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
           <div className="h-4 w-full bg-emerald-500" />
           <CardContent className="p-12">
              <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto mb-6" />
              <h2 className="text-4xl font-display font-extrabold text-foreground mb-6">Test Submitted!</h2>
              <div className="inline-block bg-secondary rounded-3xl p-8 mb-8">
                 <div className="text-7xl font-black text-emerald-600 mb-2">{result.percentage}%</div>
                 <p className="text-lg font-bold text-muted-foreground">Score: {result.earnedPoints} / {result.totalPoints} pts</p>
              </div>
              <Button onClick={() => setLocation("/student/tests")} className="h-14 px-10 rounded-xl text-lg w-full max-w-xs">
                Back to Dashboard
              </Button>
           </CardContent>
         </Card>
       </div>
    );
  }

  const handleSelect = (qId: number, opt: string) => {
    setAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const handleSubmit = () => {
    if (!studentCode) return;
    submitMut.mutate({
      testId,
      data: {
        studentCode,
        answers: Object.entries(answers).map(([qId, ans]) => ({
          questionId: Number(qId),
          answer: ans as "A" | "B" | "C" | "D"
        }))
      }
    }, {
      onSuccess: (res) => setResult(res)
    });
  };

  const isComplete = test.questions.every(q => answers[q.id]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm flex items-center justify-between sticky top-24 z-10">
        <div>
           <h1 className="text-2xl font-display font-bold text-foreground">{test.title}</h1>
           <p className="text-muted-foreground font-medium mt-1">{test.questions.length} Questions</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl text-foreground font-bold">
           <Clock className="w-5 h-5" />
           {test.durationMinutes}m Max
        </div>
      </div>

      <div className="space-y-8">
        {test.questions.map((q, idx) => (
           <Card key={q.id} className="border-border shadow-sm rounded-2xl overflow-hidden">
             <div className="bg-secondary/50 px-6 py-4 border-b border-border flex justify-between items-center">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-sm">Question {idx + 1}</span>
                <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg text-sm">{q.points} pts</span>
             </div>
             <CardContent className="p-8">
                <p className="text-lg font-medium text-foreground mb-8">{q.questionText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => {
                    const optionText = (q as any)[`option${opt}`];
                    const isSelected = answers[q.id] === opt;
                    return (
                      <button 
                        key={opt}
                        onClick={() => handleSelect(q.id, opt)}
                        className={`text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected 
                            ? 'border-accent bg-accent/5 shadow-md' 
                            : 'border-border/50 bg-secondary/20 hover:border-border hover:bg-secondary/50'
                        }`}
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isSelected ? 'bg-accent text-accent-foreground' : 'bg-background border border-border text-muted-foreground'
                        }`}>
                          {opt}
                        </div>
                        <span className={`font-medium pt-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {optionText}
                        </span>
                      </button>
                    )
                  })}
                </div>
             </CardContent>
           </Card>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border flex justify-center z-20">
        <Button 
          onClick={handleSubmit} 
          disabled={!isComplete || submitMut.isPending}
          className="h-16 px-16 rounded-2xl text-xl font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/25"
        >
          {submitMut.isPending ? "Submitting..." : "Submit Answers"}
        </Button>
      </div>
    </div>
  )
}
