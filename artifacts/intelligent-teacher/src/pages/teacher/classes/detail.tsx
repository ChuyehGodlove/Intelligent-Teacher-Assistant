import { useRoute, Link } from "wouter";
import { useGetClass, useGetClassCUI, useGetStudents, useGetTests } from "@workspace/api-client-react";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadialProgress } from "@/components/ui/radial-progress";
import { Users, FileText, CheckCircle2, TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react";

export default function ClassDetail() {
  const [params] = useRoute("/classes/:id");
  const classId = Number(params?.id);

  const { data: cls, isLoading: clsLoading } = useGetClass(classId);
  const { data: cui, isLoading: cuiLoading } = useGetClassCUI(classId);
  const { data: students, isLoading: studentsLoading } = useGetStudents({ classId });
  const { data: tests, isLoading: testsLoading } = useGetTests({ classId });

  if (clsLoading || cuiLoading || studentsLoading || testsLoading) return <LoadingScreen />;
  if (!cls) return <div className="p-8">Class not found</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
        <div className="inline-flex px-3 py-1 bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider rounded-full mb-4">
          {cls.grade} • {cls.subject}
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">{cls.name}</h1>
          <Link href={`/analysis/${classId}`}>
            <Button className="rounded-xl gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/25 text-white font-bold">
              <BarChart2 className="w-4 h-4" />
              📊 Analysis Dashboard
            </Button>
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-6 text-sm font-semibold text-muted-foreground">
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl">
            <Users className="w-5 h-5" /> {students?.length || 0} Students
          </div>
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl">
            <FileText className="w-5 h-5" /> {tests?.length || 0} Tests
          </div>
          <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Avg Score: {cui?.averageScore || 0}%
          </div>
        </div>
      </div>

      {cui && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-1 border-border shadow-sm flex flex-col items-center justify-center p-8">
             <h2 className="text-xl font-display font-bold mb-8 self-start w-full">CUI Score</h2>
             <RadialProgress value={cui.cuiScore} label={`${cui.cuiScore}`} sublabel="INDEX" size={180} strokeWidth={16} />
             <div className="mt-8 flex items-center gap-2 font-bold text-lg">
                Trend: 
                <span className="flex items-center gap-1">
                  {cui.recentTrend === 'improving' && <><TrendingUp className="text-emerald-500"/> <span className="text-emerald-500">Improving</span></>}
                  {cui.recentTrend === 'declining' && <><TrendingDown className="text-destructive"/> <span className="text-destructive">Declining</span></>}
                  {cui.recentTrend === 'stable' && <><Minus className="text-yellow-500"/> <span className="text-yellow-500">Stable</span></>}
                </span>
             </div>
           </Card>

           <Card className="lg:col-span-2 border-border shadow-sm p-8">
             <h2 className="text-xl font-display font-bold mb-6">Topic Breakdown</h2>
             <div className="space-y-6">
                {cui.topicBreakdown.map(t => (
                  <div key={t.topic}>
                    <div className="flex justify-between font-semibold mb-2">
                      <span>{t.topic}</span>
                      <span className={t.score < 60 ? 'text-destructive' : 'text-primary'}>{t.score}%</span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                       <div className={`h-full rounded-full ${t.score < 60 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${t.score}%` }} />
                    </div>
                  </div>
                ))}
                {cui.topicBreakdown.length === 0 && <div className="text-muted-foreground">Not enough data to calculate topics.</div>}
             </div>
           </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Students List */}
        <Card className="shadow-sm">
          <div className="p-6 border-b border-border bg-secondary/30 rounded-t-xl">
            <h2 className="text-xl font-display font-bold">Roster</h2>
          </div>
          <div className="p-0">
            <table className="w-full text-left">
              <tbody className="divide-y divide-border">
                {students?.map(s => (
                  <tr key={s.id} className="hover:bg-secondary/20">
                    <td className="p-4 font-semibold">{s.name}</td>
                    <td className="p-4 text-muted-foreground">{s.studentCode}</td>
                  </tr>
                ))}
                {(!students || students.length === 0) && (
                  <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">No students enrolled.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Tests List */}
        <Card className="shadow-sm">
          <div className="p-6 border-b border-border bg-secondary/30 rounded-t-xl">
            <h2 className="text-xl font-display font-bold">Tests</h2>
          </div>
          <div className="p-0">
            <table className="w-full text-left">
              <tbody className="divide-y divide-border">
                {tests?.map(t => (
                  <tr key={t.id} className="hover:bg-secondary/20">
                    <td className="p-4 font-semibold">{t.title}</td>
                    <td className="p-4 text-right">
                      {t.isActive ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">ACTIVE</span>
                      ) : (
                        <span className="px-3 py-1 bg-secondary text-muted-foreground rounded-full text-xs font-bold">CLOSED</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!tests || tests.length === 0) && (
                  <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">No tests created.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
