import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, GraduationCap, BarChart2, Brain, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ── Math background symbols ─────────────────────────────────────────────────
function MathBackground() {
  const symbols = [
    { x: "4%",  y: "6%",  text: "∫f(x)dx",     size: "text-3xl", op: "opacity-[0.055]", rot: "-15deg" },
    { x: "88%", y: "4%",  text: "Σ",            size: "text-6xl", op: "opacity-[0.06]",  rot: "10deg"  },
    { x: "93%", y: "28%", text: "∂y/∂x",        size: "text-2xl", op: "opacity-[0.05]",  rot: "20deg"  },
    { x: "2%",  y: "42%", text: "π²",           size: "text-5xl", op: "opacity-[0.06]",  rot: "-8deg"  },
    { x: "14%", y: "80%", text: "√(a²+b²)",     size: "text-2xl", op: "opacity-[0.055]", rot: "12deg"  },
    { x: "78%", y: "72%", text: "e^iπ + 1 = 0", size: "text-xl",  op: "opacity-[0.06]",  rot: "-10deg" },
    { x: "42%", y: "91%", text: "∮",            size: "text-5xl", op: "opacity-[0.05]",  rot: "5deg"   },
    { x: "54%", y: "2%",  text: "lim(x→∞)",    size: "text-xl",  op: "opacity-[0.055]", rot: "-5deg"  },
    { x: "66%", y: "52%", text: "∇²φ = 0",      size: "text-lg",  op: "opacity-[0.045]", rot: "18deg"  },
    { x: "29%", y: "16%", text: "α + β = γ",    size: "text-xl",  op: "opacity-[0.055]", rot: "-12deg" },
    { x: "7%",  y: "65%", text: "⊂ ∩ ∪",       size: "text-2xl", op: "opacity-[0.045]", rot: "8deg"   },
    { x: "74%", y: "12%", text: "Δx → 0",       size: "text-lg",  op: "opacity-[0.055]", rot: "-6deg"  },
    { x: "21%", y: "52%", text: "∞",            size: "text-7xl", op: "opacity-[0.04]",  rot: "0deg"   },
    { x: "59%", y: "83%", text: "d²y/dx²",      size: "text-xl",  op: "opacity-[0.055]", rot: "-18deg" },
    { x: "47%", y: "38%", text: "P(A∩B)",       size: "text-lg",  op: "opacity-[0.04]",  rot: "7deg"   },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden>
      {symbols.map((s, i) => (
        <div key={i} className={`absolute font-mono font-bold text-primary ${s.size} ${s.op}`}
          style={{ left: s.x, top: s.y, transform: `rotate(${s.rot})` }}>{s.text}</div>
      ))}
    </div>
  );
}

// ── Mastery Matrix static preview ───────────────────────────────────────────
function MasteryMatrixPreview() {
  const topics = ["Quadratics", "Differentiation", "Integration", "Vectors", "Statistics"];
  const students = ["A. Johnson", "B. Smith", "C. Lee", "D. Patel"];
  const data = [
    [92, 85, 40, 78, 90],
    [60, 30, 72, 88, 55],
    [88, 92, 85, 40, 76],
    [45, 68, 90, 95, 82],
  ];
  const cell = (v: number) =>
    v >= 80 ? "bg-emerald-400 text-white" :
    v >= 60 ? "bg-yellow-400 text-gray-900" :
    "bg-red-400 text-white";

  return (
    <div className="overflow-x-auto rounded-2xl">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left font-semibold text-muted-foreground w-24">Student</th>
            {topics.map(t => (
              <th key={t} className="p-2 text-center font-semibold text-muted-foreground">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s, ri) => (
            <tr key={s}>
              <td className="p-2 font-semibold text-foreground text-xs">{s}</td>
              {data[ri]!.map((v, ci) => (
                <td key={ci} className="p-1">
                  <div className={`${cell(v)} rounded-lg h-8 flex items-center justify-center font-bold text-xs`}>{v}%</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /> ≥80% Mastery</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-400" /> 60–79% Developing</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" /> &lt;60% Struggling</div>
      </div>
    </div>
  );
}

// ── Class Analytics static preview ─────────────────────────────────────────
function ClassAnalyticsPreview() {
  const classes = [
    { name: "Class 10A", subject: "Mathematics", cui: 85, trend: "up", students: 24, tests: 5 },
    { name: "Class 9B",  subject: "Science",     cui: 63, trend: "flat", students: 18, tests: 3 },
    { name: "Class 11C", subject: "English",     cui: 91, trend: "up", students: 20, tests: 4 },
  ];
  const getColor = (v: number) => v >= 80 ? "#22c55e" : v >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="grid grid-cols-1 gap-4">
      {classes.map(c => (
        <div key={c.name} className="bg-background/60 border border-border rounded-2xl p-4 flex items-center gap-5">
          <div className="relative w-14 h-14 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
              <circle cx="18" cy="18" r="14" fill="none" stroke={getColor(c.cui)} strokeWidth="4"
                strokeLinecap="round" strokeDasharray={`${(c.cui / 100) * 87.96} 87.96`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-foreground">{c.cui}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-bold text-foreground text-sm">{c.name}</p>
              <div className="flex items-center gap-1 text-xs font-semibold">
                {c.trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> :
                 c.trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> :
                 <Minus className="w-3.5 h-3.5 text-yellow-500" />}
                <span className={c.trend === "up" ? "text-emerald-600" : c.trend === "down" ? "text-red-600" : "text-yellow-600"}>
                  {c.trend === "up" ? "improving" : c.trend === "down" ? "declining" : "stable"}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{c.subject} · {c.students} students · {c.tests} tests</p>
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${c.cui}%`, backgroundColor: getColor(c.cui) }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Teacher / Student portal card ─────────────────────────────────────────────
function PortalCard({ href, role, title, description, cta, accent }: {
  href: string; role: "teacher" | "student"; title: string;
  description: string; cta: string; accent: string;
}) {
  const isTeacher = role === "teacher";
  return (
    <Link href={href} className="group block">
      <div className={`relative h-full bg-card/80 backdrop-blur-xl border-2 rounded-[2rem] p-10 shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center cursor-pointer overflow-hidden ${
        isTeacher ? "border-primary/30 hover:border-primary hover:shadow-primary/20" : "border-accent/30 hover:border-accent hover:shadow-accent/20"
      }`}>
        {/* Background gradient on hover */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isTeacher ? "bg-gradient-to-br from-primary/5 to-transparent" : "bg-gradient-to-br from-accent/5 to-transparent"}`} />

        {/* Avatar */}
        <div className="relative mb-8">
          <div className={`absolute inset-0 ${isTeacher ? "bg-primary/20" : "bg-accent/20"} rounded-full blur-2xl group-hover:blur-3xl transition-all`} />
          <div className={`relative z-10 w-32 h-32 rounded-full ring-8 ring-card shadow-xl flex items-center justify-center ${isTeacher ? "bg-gradient-to-br from-primary to-indigo-600" : "bg-gradient-to-br from-accent to-cyan-500"} group-hover:scale-105 transition-transform duration-300`}>
            {isTeacher
              ? <BookOpen className="w-16 h-16 text-white" />
              : <GraduationCap className="w-16 h-16 text-white" />
            }
          </div>
        </div>

        <h2 className="text-3xl font-display font-bold text-foreground mb-3 relative z-10">{title}</h2>
        <p className="text-muted-foreground text-base leading-relaxed max-w-xs mb-8 relative z-10">{description}</p>
        <div className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl w-full font-bold text-base relative z-10 transition-all ${
          isTeacher
            ? "bg-primary text-primary-foreground group-hover:bg-primary/90"
            : "bg-accent text-accent-foreground group-hover:bg-accent/90"
        }`}>
          {cta} <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

export default function Landing() {
  const { isTeacher, isStudent } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MathBackground />

      {/* Gradient blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/12 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-accent/12 blur-[110px] rounded-full pointer-events-none" />
      <div className="absolute top-[35%] left-[45%] w-[25%] h-[25%] bg-indigo-400/8 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 pt-14 pb-24">

        {/* Nav strip */}
        <div className="w-full max-w-5xl flex justify-between items-center mb-14">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xl font-display font-extrabold text-foreground">Intelli<span className="text-primary">Teach</span></span>
          </div>
          <div className="flex items-center gap-3">
            {isTeacher ? (
              <Link href="/dashboard" className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors">
                Go to Dashboard →
              </Link>
            ) : isStudent ? (
              <Link href="/student/tests" className="px-5 py-2 bg-accent text-accent-foreground font-semibold rounded-xl text-sm hover:bg-accent/90 transition-colors">
                My Tests →
              </Link>
            ) : (
              <>
                <Link href="/auth" className="px-5 py-2 bg-secondary text-foreground font-semibold rounded-xl text-sm hover:bg-secondary/80 transition-colors">
                  Sign In
                </Link>
                <Link href="/auth" className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-14 animate-in slide-in-from-bottom-8 fade-in duration-700 max-w-4xl">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold tracking-wide text-sm">
            EDUCATION INTELLIGENCE PLATFORM
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground tracking-tight leading-tight">
            Intelligent{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-accent">
              Teacher
            </span>
            {" "}Assistant
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto font-medium leading-relaxed">
            AI-powered class insights, automated MCQ grading, teacher-led structured marking,
            and a Mastery Matrix that tells you exactly where each student needs support.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {[
              { icon: BarChart2, label: "Class Understanding Index" },
              { icon: Brain, label: "AI Error Categorisation" },
              { icon: GraduationCap, label: "MCQ + Written Tests" },
              { icon: BookOpen, label: "Paper OCR Upload" },
            ].map(f => (
              <span key={f.label} className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary border border-border rounded-full text-sm font-semibold text-foreground">
                <f.icon className="w-3.5 h-3.5 text-primary" />{f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Portal cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <PortalCard
            href={isTeacher ? "/dashboard" : "/auth"}
            role="teacher"
            title="I am a Teacher"
            description="Manage classes, build tests with MCQ & written questions, view AI-flagged insights and mark structured answers."
            cta={isTeacher ? "Enter Dashboard" : "Teacher Sign Up / In"}
            accent="primary"
          />
          <PortalCard
            href="/student"
            role="student"
            title="I am a Student"
            description="Log in with your student code or email to access your class tests, answer MCQ and written questions."
            cta="Enter Student Portal"
            accent="accent"
          />
        </div>

        {/* Dashboard Previews */}
        <div className="w-full max-w-6xl">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-wide mb-3">
              BUILT-IN ANALYTICS
            </span>
            <h2 className="text-3xl font-display font-extrabold text-foreground">
              See Every Student's Mastery Level At A Glance
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              From individual topic mastery to whole-class understanding trends — all in one dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mastery Matrix Preview */}
            <div className="bg-card/70 backdrop-blur-2xl border border-border rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <p className="font-bold text-foreground">Mastery Matrix</p>
                  <p className="text-xs text-muted-foreground">Class 10A · Mathematics</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full">Live Preview</span>
              </div>
              <div className="p-6">
                <MasteryMatrixPreview />
              </div>
            </div>

            {/* Class Analytics Preview */}
            <div className="bg-card/70 backdrop-blur-2xl border border-border rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <p className="font-bold text-foreground">Class Analytics</p>
                  <p className="text-xs text-muted-foreground">Class Understanding Index (CUI)</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">79.7%</p>
                  <p className="text-xs text-muted-foreground">Avg CUI</p>
                </div>
              </div>
              <div className="p-6">
                <ClassAnalyticsPreview />
              </div>
            </div>
          </div>

          {/* AI features strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            {[
              {
                icon: Brain,
                color: "bg-red-100 text-red-700",
                title: "AI Error Detection",
                desc: "Automatically categorises structured answer errors as Conceptual or Procedural for targeted teaching.",
              },
              {
                icon: BarChart2,
                color: "bg-amber-100 text-amber-700",
                title: "Question Flagging",
                desc: "Flags any question where >50% of the class struggled so you know exactly what to re-teach.",
              },
              {
                icon: BookOpen,
                color: "bg-indigo-100 text-indigo-700",
                title: "Submission Lock",
                desc: "Once a student submits a test it's locked — preventing any edits or re-submissions.",
              },
            ].map(f => (
              <div key={f.title} className="bg-card/70 backdrop-blur-xl border border-border rounded-2xl p-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
