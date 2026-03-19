import { useRoute } from "wouter";
import { useGetTest, useGetResults } from "@workspace/api-client-react";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, LayoutList } from "lucide-react";

export default function TestDetail() {
  const [params] = useRoute("/tests/:id");
  const testId = Number(params?.id);

  const { data: test, isLoading: testLoading } = useGetTest(testId);
  const { data: results, isLoading: resultsLoading } = useGetResults({ testId });

  if (testLoading || resultsLoading) return <LoadingScreen />;
  if (!test) return <div className="p-8">Test not found</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
        <div className="inline-flex px-3 py-1 bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider rounded-full mb-4">
          Test ID: {test.id}
        </div>
        <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">{test.title}</h1>
        <div className="mt-6 flex flex-wrap gap-6 text-sm font-semibold text-muted-foreground">
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl">
            <LayoutList className="w-5 h-5" /> {test.questions.length} Questions
          </div>
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl">
            <Clock className="w-5 h-5" /> {test.durationMinutes} Minutes
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Results Table */}
        <Card className="shadow-sm">
          <div className="p-6 border-b border-border bg-secondary/30 rounded-t-xl">
            <h2 className="text-xl font-display font-bold">Student Submissions</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-border">
                <tr>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Student</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Score</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results?.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/20">
                    <td className="p-4">
                       <div className="font-bold">{r.studentName}</div>
                       <div className="text-xs text-muted-foreground">{r.studentCode}</div>
                    </td>
                    <td className="p-4 text-right">
                       <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                          r.percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          r.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {r.percentage}%
                       </span>
                    </td>
                    <td className="p-4 text-right font-medium text-muted-foreground">
                       {r.earnedPoints} / {r.totalPoints}
                    </td>
                  </tr>
                ))}
                {(!results || results.length === 0) && (
                  <tr><td colSpan={3} className="p-12 text-center text-muted-foreground font-medium">No submissions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Questions Preview */}
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold">Questions Preview</h2>
          {test.questions.map((q, i) => (
             <Card key={q.id} className="shadow-sm border-border/80">
                <CardContent className="p-6">
                   <div className="font-bold text-sm text-primary mb-2">Question {i + 1} ({q.points} pts)</div>
                   <p className="font-medium text-foreground mb-4">{q.questionText}</p>
                   <ul className="space-y-2 text-sm">
                      <li className="p-2 rounded-lg bg-secondary/50 border border-border font-medium">A. {q.optionA}</li>
                      <li className="p-2 rounded-lg bg-secondary/50 border border-border font-medium">B. {q.optionB}</li>
                      <li className="p-2 rounded-lg bg-secondary/50 border border-border font-medium">C. {q.optionC}</li>
                      <li className="p-2 rounded-lg bg-secondary/50 border border-border font-medium">D. {q.optionD}</li>
                   </ul>
                </CardContent>
             </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
