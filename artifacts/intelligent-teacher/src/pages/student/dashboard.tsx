import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useStudent } from "@/context/StudentContext";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Trophy, TrendingUp, TrendingDown, Minus, FileText,
  Clock, CheckCircle2, Target, ArrowRight, BookOpen,
} from "lucide-react";

const base = import.meta.env.BASE_URL;

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2.5 rounded-xl bg-secondary ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-foreground">{value}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

export default function StudentDashboard() {
  const { studentCode, studentInfo } = useStudent();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentCode) { setLocation("/student"); return; }
    fetch(`${base}api/results/student/${encodeURIComponent(studentCode)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentCode]);

  if (loading) return <LoadingScreen />;

  const results: any[] = data?.results ?? [];
  const testsTaken = results.length;
  const avgScore = testsTaken > 0
    ? Math.round(results.reduce((s: number, r: any) => s + r.percentage, 0) / testsTaken * 10) / 10
    : 0;
  const bestScore = testsTaken > 0 ? Math.max(...results.map((r: any) => r.percentage)) : 0;
  const pendingMarking = results.filter((r: any) => r.status === "submitted").length;

  // Performance trend (last 8, chronological order)
  const trendData = [...results].reverse().slice(-8).map((r: any, i: number) => ({
    name: r.testTitle.length > 12 ? r.testTitle.slice(0, 12) + "…" : r.testTitle,
    score: r.percentage,
    idx: i + 1,
  }));

  // Trend direction
  const recentTrend = trendData.length >= 2
    ? trendData[trendData.length - 1]!.score - trendData[trendData.length - 2]!.score
    : 0;

  const TrendIcon = recentTrend > 5 ? TrendingUp : recentTrend < -5 ? TrendingDown : Minus;
  const trendColor = recentTrend > 5 ? "text-emerald-600" : recentTrend < -5 ? "text-red-500" : "text-amber-500";

  const name = studentInfo?.studentName ?? studentCode ?? "Student";
  const firstWord = name.split(" ")[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Welcome back
          </p>
          <h1 className="text-4xl font-display font-extrabold text-foreground">
            {firstWord}! 👋
          </h1>
          {studentInfo?.className && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
              <BookOpen className="w-3 h-3" /> {studentInfo.className}
            </div>
          )}
        </div>
        <Link href="/student/tests">
          <Button className="rounded-xl gap-2">
            <FileText className="w-4 h-4" /> Take a Test
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText}    label="Tests Taken"  value={testsTaken}  color="text-primary" />
        <StatCard icon={Target}      label="Average Score" value={`${avgScore}%`}
          color={avgScore >= 70 ? "text-emerald-600" : avgScore >= 50 ? "text-amber-500" : "text-red-500"}
          sub={avgScore >= 70 ? "On track" : avgScore >= 50 ? "Getting there" : "Needs focus"} />
        <StatCard icon={Trophy}      label="Best Score"   value={`${bestScore}%`} color="text-amber-500" />
        <StatCard icon={TrendIcon}   label="Trend"        value={recentTrend > 0 ? `+${Math.round(recentTrend)}%` : `${Math.round(recentTrend)}%`}
          color={trendColor}
          sub={recentTrend > 5 ? "Improving" : recentTrend < -5 ? "Declining" : "Stable"} />
      </div>

      {testsTaken === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-border rounded-3xl">
          <FileText className="w-14 h-14 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-2xl font-display font-bold mb-2">No Tests Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            You haven't taken any tests yet. Head to your tests page to get started.
          </p>
          <Link href="/student/tests">
            <Button className="rounded-xl gap-2">View My Tests <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Performance trend chart */}
          {trendData.length > 1 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-display font-bold">Performance Trend</h2>
                  <div className={`flex items-center gap-1.5 text-sm font-bold ${trendColor}`}>
                    <TrendIcon className="w-4 h-4" />
                    {recentTrend > 5 ? "Improving" : recentTrend < -5 ? "Declining" : "Stable"}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-5">Your last {trendData.length} test scores</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: any) => [`${v}%`, "Score"]}
                    />
                    <ReferenceLine y={60} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Pass (60%)", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "white" }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Score distribution bar chart */}
          {trendData.length >= 3 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-display font-bold mb-1">Score by Test</h2>
                <p className="text-xs text-muted-foreground mb-5">Bar height = your score percentage</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={trendData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip formatter={(v: any) => [`${v}%`, "Score"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]}
                      fill="hsl(var(--primary))"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Test history list */}
          <div>
            <h2 className="text-xl font-display font-bold mb-4">Test History</h2>
            <div className="space-y-3">
              {results.map((r: any) => {
                const passed = r.percentage >= 60;
                return (
                  <div key={r.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 transition-colors group">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {passed ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{r.testTitle}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(r.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}{r.earnedPoints}/{r.totalPoints} pts
                      </p>
                    </div>
                    <div className={`text-xl font-black shrink-0 ${passed ? "text-emerald-600" : "text-red-500"}`}>
                      {r.percentage}%
                    </div>
                    <Link href={`/student/results/${r.id}`}>
                      <button className="flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        Review <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
