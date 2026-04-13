import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
  LineChart, Line,
} from "recharts";
import {
  BarChart2, Users, FileText, TrendingUp, TrendingDown, Minus,
  Brain, Wrench, CheckCircle, AlertTriangle, Info, ChevronDown, ChevronUp,
  Printer, ArrowLeft, X, Star, Target, BookOpen,
} from "lucide-react";

const base = import.meta.env.BASE_URL;

// ── Palette ─────────────────────────────────────────────────────────────────
const COLORS = {
  primary: "#6366f1",
  accent: "#06b6d4",
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#94a3b8",
};
const DIST_COLORS = [COLORS.red, COLORS.amber, COLORS.amber, COLORS.emerald, COLORS.emerald];
const PIE_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b"];

type Tab = "overview" | "items" | "students" | "insights";

// ── Severity icon ─────────────────────────────────────────────────────────────
function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "critical") return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />;
  if (severity === "warning")  return <Info className="w-4 h-4 text-amber-500 shrink-0" />;
  return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
}

// ── p-value badge ─────────────────────────────────────────────────────────────
function PValueBadge({ p }: { p: number }) {
  const pct = Math.round(p * 100);
  const color = p < 0.2 || p > 0.85
    ? "bg-red-100 text-red-700"
    : p >= 0.3 && p <= 0.7
    ? "bg-emerald-100 text-emerald-700"
    : "bg-amber-100 text-amber-700";
  const label = p < 0.2 ? "Hard" : p > 0.85 ? "Easy" : "Good";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{pct}%</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ── D-index badge ─────────────────────────────────────────────────────────────
function DBadge({ d }: { d: number }) {
  const color = d >= 0.3 ? "bg-emerald-100 text-emerald-700" : d >= 0.2 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  const label = d >= 0.3 ? "Good" : d >= 0.2 ? "Fair" : "Poor";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{d.toFixed(2)}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2.5 rounded-xl bg-secondary ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-right flex-1">
          <p className="text-2xl font-black text-foreground">{value}</p>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h3 className="text-xl font-display font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AnalysisDashboard() {
  const [params] = useRoute("/analysis/:classId");
  const classId = Number(params?.classId);

  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [classAvg, setClassAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [itemModal, setItemModal] = useState<any>(null);
  const [studentModal, setStudentModal] = useState<any>(null);

  // Student sort
  const [sortKey, setSortKey] = useState<"name" | "testsTaken" | "averageScore">("averageScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!classId) return;
    (async () => {
      setLoading(true);
      const [ov, it, st, ins] = await Promise.all([
        fetch(`${base}api/analysis/class/${classId}/overview`).then(r => r.json()),
        fetch(`${base}api/analysis/class/${classId}/items`).then(r => r.json()),
        fetch(`${base}api/analysis/class/${classId}/students`).then(r => r.json()),
        fetch(`${base}api/analysis/class/${classId}/insights`).then(r => r.json()),
      ]);
      setOverview(ov);
      setItems(it.items ?? []);
      setStudents(st.students ?? []);
      setInsights(ins.insights ?? []);
      setClassAvg(ins.classAvg ?? 0);
      setLoading(false);
    })();
  }, [classId]);

  if (loading) return <LoadingScreen />;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview",  label: "Overview",            icon: BarChart2 },
    { id: "items",     label: "Item Analysis",        icon: Target    },
    { id: "students",  label: "Student Performance",  icon: Users     },
    { id: "insights",  label: "AI Insights",          icon: Brain     },
  ];

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortedStudents = [...students].sort((a, b) => {
    const av = a[sortKey]; const bv = b[sortKey];
    const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ k }: { k: typeof sortKey }) =>
    sortKey === k
      ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronUp className="w-3 h-3 inline" />)
      : <ChevronDown className="w-3 h-3 inline opacity-30" />;

  // Distribution chart data
  const distLabels = ["0–20%", "21–40%", "41–60%", "61–80%", "81–100%"];
  const distData = (overview?.scoreDistribution ?? [0,0,0,0,0]).map((v: number, i: number) => ({
    range: distLabels[i], count: v,
  }));

  // Strengths/weaknesses chart data
  const strengthData = (overview?.topStrengths ?? []).map((s: any) => ({ name: s.title.slice(0, 18), avg: s.avg }));
  const weakData     = (overview?.topWeaknesses ?? []).map((s: any) => ({ name: s.title.slice(0, 18), avg: s.avg }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href={`/classes/${classId}`}>
          <button className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Class
          </button>
        </Link>
        <div className="flex-1">
          <div className="inline-flex px-3 py-1 bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider rounded-full mb-1">
            Analysis Dashboard
          </div>
          <h1 className="text-3xl font-display font-extrabold text-foreground">
            {overview?.className ?? `Class ${classId}`}
          </h1>
          {overview?.classCode && (
            <p className="text-sm text-muted-foreground font-medium mt-0.5">Code: {overview.classCode}</p>
          )}
        </div>
        <Button
          variant="outline"
          className="rounded-xl gap-2"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" /> Print Report
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users}     label="Students"       value={overview?.totalStudents ?? 0} color="text-primary" />
            <StatCard icon={FileText}  label="Tests"          value={overview?.totalTests ?? 0} color="text-indigo-500" />
            <StatCard icon={CheckCircle} label="Submissions"  value={overview?.totalSubmissions ?? 0} color="text-emerald-500" />
            <StatCard icon={BarChart2} label="Class Average"  value={`${overview?.averageScore ?? 0}%`}
              sub={overview?.averageScore >= 70 ? "Above target" : overview?.averageScore >= 50 ? "Near target" : "Below target"}
              color={overview?.averageScore >= 70 ? "text-emerald-500" : overview?.averageScore >= 50 ? "text-amber-500" : "text-red-500"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Score distribution */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-display font-bold mb-1">Score Distribution</h2>
                <p className="text-xs text-muted-foreground mb-5">Number of submissions in each score bracket</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: any) => [`${v} student${v !== 1 ? "s" : ""}`, "Count"]}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {distData.map((_: any, i: number) => (
                        <Cell key={i} fill={DIST_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* KR-20 + strengths */}
            <div className="space-y-4">
              {/* Reliability gauge */}
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-display font-bold">Test Reliability</h2>
                    <p className="text-xs text-muted-foreground">Kuder-Richardson KR-20</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-black ${
                      overview?.reliabilityKR20 >= 0.7 ? "text-emerald-600"
                      : overview?.reliabilityKR20 >= 0.5 ? "text-amber-500"
                      : "text-red-500"
                    }`}>{overview?.reliabilityKR20 ?? 0}</div>
                    <p className="text-xs font-bold text-muted-foreground">
                      {overview?.reliabilityKR20 >= 0.7 ? "Strong" : overview?.reliabilityKR20 >= 0.5 ? "Acceptable" : "Weak"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${overview?.reliabilityKR20 >= 0.7 ? "bg-emerald-500" : overview?.reliabilityKR20 >= 0.5 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ width: `${(overview?.reliabilityKR20 ?? 0) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Target ≥ 0.70 for reliable assessment. Based on MCQ questions only.
                </p>
              </Card>

              {/* Top performance by test */}
              {strengthData.length > 0 && (
                <Card className="p-5">
                  <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" /> Strongest Tests
                  </h2>
                  <div className="space-y-2">
                    {strengthData.map((s: any) => (
                      <div key={s.name} className="flex items-center gap-3">
                        <div className="flex-1 text-sm font-medium text-foreground truncate">{s.name}</div>
                        <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.avg}%` }} />
                        </div>
                        <div className="text-sm font-bold text-emerald-700 w-12 text-right">{s.avg}%</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {weakData.length > 0 && (
                <Card className="p-5">
                  <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-400" /> Weakest Tests
                  </h2>
                  <div className="space-y-2">
                    {weakData.map((s: any) => (
                      <div key={s.name} className="flex items-center gap-3">
                        <div className="flex-1 text-sm font-medium text-foreground truncate">{s.name}</div>
                        <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${s.avg}%` }} />
                        </div>
                        <div className="text-sm font-bold text-red-600 w-12 text-right">{s.avg}%</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {overview?.totalSubmissions === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl">
              <BarChart2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">No Submissions Yet</h3>
              <p className="text-muted-foreground">Analysis will appear once students start submitting tests.</p>
            </div>
          )}
        </div>
      )}

      {/* ── ITEM ANALYSIS TAB ────────────────────────────────────────── */}
      {tab === "items" && (
        <div className="space-y-6">
          <div className="bg-secondary/50 border border-border rounded-2xl p-4 text-sm text-muted-foreground flex gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> p 0.3–0.7: Good difficulty</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> p &lt;0.2 or &gt;0.85: Too hard/easy</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> D ≥0.3: Good discrimination</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> D &lt;0.2: Poor discrimination</span>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Questions Yet</h3>
              <p>Create tests with questions to see item-level analysis.</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/60 border-b border-border">
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-12">#</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Question</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Test</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Type</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Difficulty (p)</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Discrim. (D)</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Top Wrong</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item, idx) => (
                      <tr key={item.questionId} className={`hover:bg-secondary/20 ${item.commonMisconception ? "bg-red-50/30" : ""}`}>
                        <td className="p-4 text-sm font-bold text-muted-foreground">{item.globalIndex}</td>
                        <td className="p-4 max-w-xs">
                          <p className="font-medium text-sm text-foreground truncate">{item.questionText}</p>
                          {item.commonMisconception && (
                            <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" /> Common misconception
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground font-medium">{item.testTitle}</td>
                        <td className="p-4 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.questionType === "mcq" ? "bg-primary/10 text-primary" : "bg-indigo-100 text-indigo-700"}`}>
                            {item.questionType === "mcq" ? "MCQ" : "Written"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {item.totalAttempts > 0 ? <PValueBadge p={item.pValue} /> : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="p-4 text-center">
                          {item.totalAttempts >= 4 ? <DBadge d={item.discrimination} /> : <span className="text-xs text-muted-foreground">n/a</span>}
                        </td>
                        <td className="p-4 text-center">
                          {item.mostPopularWrong
                            ? <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">Opt {item.mostPopularWrong}</span>
                            : <span className="text-xs text-muted-foreground">—</span>
                          }
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs h-8"
                            onClick={() => setItemModal(item)}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STUDENT PERFORMANCE TAB ──────────────────────────────────── */}
      {tab === "students" && (
        <div className="space-y-6">
          {students.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Students Enrolled</h3>
              <p>Students need to enrol in this class first.</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/60 border-b border-border">
                      <th
                        className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("name")}
                      >Name <SortIcon k="name" /></th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Code</th>
                      <th
                        className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("testsTaken")}
                      >Tests <SortIcon k="testsTaken" /></th>
                      <th
                        className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center cursor-pointer hover:text-foreground"
                        onClick={() => handleSort("averageScore")}
                      >Avg Score <SortIcon k="averageScore" /></th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Performance</th>
                      <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedStudents.map(s => (
                      <tr key={s.id} className="hover:bg-secondary/20">
                        <td className="p-4 font-bold text-foreground">{s.name}</td>
                        <td className="p-4 text-muted-foreground text-sm font-medium">{s.studentCode}</td>
                        <td className="p-4 text-center font-semibold">{s.testsTaken}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            s.averageScore >= 80 ? "bg-emerald-100 text-emerald-700"
                            : s.averageScore >= 60 ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                          }`}>{s.averageScore}%</span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${s.averageScore >= 80 ? "bg-emerald-500" : s.averageScore >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${s.averageScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs h-8"
                            onClick={() => setStudentModal(s)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AI INSIGHTS TAB ──────────────────────────────────────────── */}
      {tab === "insights" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <Card className="p-5 text-center">
              <p className="text-3xl font-black text-foreground">{classAvg}%</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Class Average</p>
            </Card>
            <Card className="p-5 text-center">
              <p className={`text-3xl font-black ${insights.filter(i => i.severity === "critical").length > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {insights.filter(i => i.severity === "critical").length}
              </p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Critical Issues</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-3xl font-black text-amber-500">{insights.filter(i => i.severity === "warning").length}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Warnings</p>
            </Card>
          </div>

          <div className="space-y-3">
            {insights.map((ins, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 p-5 rounded-2xl border ${
                  ins.severity === "critical"
                    ? "bg-red-50 border-red-200"
                    : ins.severity === "warning"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <SeverityIcon severity={ins.severity} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold leading-relaxed ${
                    ins.severity === "critical" ? "text-red-800"
                    : ins.severity === "warning" ? "text-amber-800"
                    : "text-emerald-800"
                  }`}>{ins.message}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${
                  ins.severity === "critical" ? "bg-red-200 text-red-700"
                  : ins.severity === "warning" ? "bg-amber-200 text-amber-700"
                  : "bg-emerald-200 text-emerald-700"
                }`}>{ins.severity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6 flex justify-end">
            <Button
              onClick={() => window.print()}
              className="gap-2 rounded-xl"
            >
              <Printer className="w-4 h-4" />
              Generate Printable Report
            </Button>
          </div>
        </div>
      )}

      {/* ── ITEM DETAIL MODAL ────────────────────────────────────────── */}
      <Modal
        open={!!itemModal}
        onClose={() => setItemModal(null)}
        title={`Question ${itemModal?.globalIndex} Details`}
      >
        {itemModal && (
          <div className="space-y-6">
            <div className="p-4 bg-secondary/50 rounded-2xl">
              <p className="font-medium text-foreground">{itemModal.questionText}</p>
              <div className="flex gap-4 mt-3 text-sm text-muted-foreground font-medium">
                <span>Test: {itemModal.testTitle}</span>
                <span>Type: {itemModal.questionType}</span>
                <span>Points: {itemModal.points}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-card border border-border rounded-xl">
                <p className="text-xl font-black text-foreground">{itemModal.totalAttempts}</p>
                <p className="text-xs text-muted-foreground font-medium">Attempts</p>
              </div>
              <div className={`p-3 rounded-xl border ${itemModal.pValue >= 0.3 && itemModal.pValue <= 0.7 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                <p className="text-xl font-black">{Math.round(itemModal.pValue * 100)}%</p>
                <p className="text-xs text-muted-foreground font-medium">Difficulty (p)</p>
              </div>
              <div className={`p-3 rounded-xl border ${itemModal.discrimination >= 0.3 ? "bg-emerald-50 border-emerald-200" : itemModal.discrimination >= 0.2 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
                <p className="text-xl font-black">{itemModal.discrimination.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground font-medium">Discrimination (D)</p>
              </div>
            </div>

            {itemModal.questionType === "mcq" && Object.keys(itemModal.distractorData).length > 0 && (
              <div>
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" /> Distractor Analysis
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={Object.entries(itemModal.distractorData).map(([k, v]) => ({ name: `Option ${k}`, value: v as number }))}
                        cx="50%" cy="50%" outerRadius={70} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                        labelLine={false}
                      >
                        {Object.keys(itemModal.distractorData).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`${v}%`, "Students"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {Object.entries(itemModal.options ?? {}).map(([opt, text]) => {
                      if (!text) return null;
                      const pct = (itemModal.distractorData[opt] ?? 0) as number;
                      const isCorrect = opt === itemModal.correctAnswer;
                      return (
                        <div key={opt} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${isCorrect ? "bg-emerald-50 border border-emerald-200" : pct > 30 ? "bg-red-50 border border-red-200" : "bg-secondary/40 border border-border"}`}>
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? "bg-emerald-500 text-white" : "bg-background border border-border"}`}>{opt}</span>
                          <span className="flex-1 truncate font-medium">{text as string}</span>
                          <span className={`font-bold text-xs shrink-0 ${pct > 30 && !isCorrect ? "text-red-600" : ""}`}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {itemModal.commonMisconception && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="font-semibold">Common misconception detected — a wrong option was chosen by more than 30% of students. Address this topic in the next class.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── STUDENT DETAIL MODAL ─────────────────────────────────────── */}
      <Modal
        open={!!studentModal}
        onClose={() => setStudentModal(null)}
        title={studentModal?.name ?? "Student"}
      >
        {studentModal && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl">
                {studentModal.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-foreground">{studentModal.name}</p>
                <p className="text-sm text-muted-foreground">{studentModal.studentCode}</p>
              </div>
              <div className={`ml-auto text-3xl font-black ${studentModal.averageScore >= 70 ? "text-emerald-600" : studentModal.averageScore >= 50 ? "text-amber-500" : "text-red-500"}`}>
                {studentModal.averageScore}%
              </div>
            </div>

            {studentModal.scores.length > 0 ? (
              <div>
                <h4 className="font-bold text-foreground mb-3">Test-by-Test Scores</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={studentModal.scores.map((s: any) => ({ name: s.testTitle.slice(0, 16), pct: s.percentage }))} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip formatter={(v: any) => [`${v}%`, "Score"]} />
                    <Bar dataKey="pct" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {studentModal.scores.map((s: any) => (
                    <div key={s.testId} className="flex items-center justify-between p-3 bg-secondary/40 rounded-xl text-sm">
                      <span className="font-medium text-foreground">{s.testTitle}</span>
                      <span className={`font-bold ${s.percentage >= 70 ? "text-emerald-700" : s.percentage >= 50 ? "text-amber-700" : "text-red-600"}`}>
                        {s.earnedPoints}/{s.totalPoints} ({s.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">No submissions yet</p>
              </div>
            )}

            {(studentModal.strengths.length > 0 || studentModal.weaknesses.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {studentModal.strengths.length > 0 && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Strengths
                    </h5>
                    <ul className="space-y-1">
                      {studentModal.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-xs text-emerald-800 font-medium truncate">{s}…</li>
                      ))}
                    </ul>
                  </div>
                )}
                {studentModal.weaknesses.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h5 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Wrench className="w-3 h-3" /> Needs Work
                    </h5>
                    <ul className="space-y-1">
                      {studentModal.weaknesses.map((s: string, i: number) => (
                        <li key={i} className="text-xs text-red-800 font-medium truncate">{s}…</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {studentModal.averageScore < 60 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium flex items-start gap-2">
                <Brain className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>{studentModal.name}</strong> is averaging below 60%. Consider a one-on-one session or targeted revision materials to support their progress.
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
