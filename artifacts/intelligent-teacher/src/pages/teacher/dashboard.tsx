import { useGetDashboardOverview } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, FileText, Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RadialProgress } from "@/components/ui/radial-progress";
import { LoadingScreen } from "@/components/ui/loading";
import { Link } from "wouter";

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboardOverview();

  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="text-center p-12 text-destructive font-semibold">Failed to load dashboard. The backend might be unavailable.</div>;
  if (!data) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">Overview</h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Welcome back! Here's how your classes are performing today.</p>
        </div>
        <Link href="/tests/create" className="hidden md:flex px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
          + Create New Test
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard title="Total Classes" value={data.totalClasses} icon={BookOpen} color="text-indigo-500" bg="bg-indigo-500/10" />
         <StatCard title="Total Students" value={data.totalStudents} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
         <StatCard title="Tests Created" value={data.totalTests} icon={FileText} color="text-cyan-500" bg="bg-cyan-500/10" />
         <StatCard title="Avg CUI Score" value={`${data.averageCUI}%`} icon={Activity} color="text-emerald-500" bg="bg-emerald-500/10" />
      </div>

      {/* CUI Section */}
      <div className="pt-4">
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Class Understanding Index (CUI)
        </h2>
        
        {data.classes.length === 0 ? (
           <Card className="p-12 text-center border-dashed border-2">
             <div className="text-muted-foreground font-medium">No classes data available yet.</div>
           </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {data.classes.map(c => (
              <Link key={c.classId} href={`/classes/${c.classId}`}>
                <Card className="h-full hover:shadow-xl hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden group">
                  <div className="h-2 w-full bg-gradient-to-r from-primary to-accent" />
                  <CardContent className="p-8 flex flex-col items-center">
                    <RadialProgress 
                      value={c.cuiScore} 
                      label={`${c.cuiScore}`} 
                      sublabel="CUI SCORE"
                      size={140} 
                      strokeWidth={14} 
                    />
                    
                    <h3 className="text-2xl font-display font-bold mt-6 text-center group-hover:text-primary transition-colors">{c.className}</h3>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground font-medium">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4"/> {c.totalStudents} Students</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {c.recentTrend === 'improving' && <TrendingUp className="w-4 h-4 text-emerald-500"/>}
                        {c.recentTrend === 'declining' && <TrendingDown className="w-4 h-4 text-destructive"/>}
                        {c.recentTrend === 'stable' && <Minus className="w-4 h-4 text-yellow-500"/>}
                        {c.recentTrend}
                      </span>
                    </div>

                    <div className="mt-8 w-full bg-secondary/50 rounded-2xl p-5">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Topic Breakdown</p>
                      <div className="space-y-3">
                        {c.topicBreakdown.map(t => (
                          <div key={t.topic} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-sm font-medium text-foreground">
                              <span>{t.topic}</span>
                              <span className={t.score < 60 ? 'text-destructive' : 'text-primary'}>{t.score}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                               <div 
                                 className={`h-full rounded-full ${t.score < 60 ? 'bg-destructive' : 'bg-primary'}`} 
                                 style={{ width: `${t.score}%` }} 
                               />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Results Table */}
      <div className="pt-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold">Recent Test Submissions</h2>
          <Link href="/tests" className="text-primary font-semibold hover:underline">View All Tests</Link>
        </div>
        <Card className="overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Student</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Test</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider text-right">Score</th>
                  <th className="p-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recentResults.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No recent submissions.</td></tr>
                )}
                {data.recentResults.map((result) => (
                  <tr key={result.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{result.studentName}</div>
                      <div className="text-xs text-muted-foreground">{result.studentCode}</div>
                    </td>
                    <td className="p-4 font-medium">{result.testTitle}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                        result.percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        result.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {result.percentage}%
                      </span>
                    </td>
                    <td className="p-4 text-right text-muted-foreground text-sm">
                      {new Date(result.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all border-border/60">
      <CardContent className="p-6 flex items-center gap-5">
        <div className={`p-4 rounded-2xl ${bg} ${color}`}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-display font-bold text-foreground mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
