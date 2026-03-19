import { Link } from "wouter";

function MathBackground() {
  const symbols = [
    { x: "5%", y: "8%", text: "∫f(x)dx", size: "text-3xl", opacity: "opacity-[0.06]", rotate: "-15deg" },
    { x: "88%", y: "5%", text: "Σ", size: "text-6xl", opacity: "opacity-[0.07]", rotate: "10deg" },
    { x: "92%", y: "30%", text: "∂y/∂x", size: "text-2xl", opacity: "opacity-[0.05]", rotate: "20deg" },
    { x: "3%", y: "45%", text: "π²", size: "text-5xl", opacity: "opacity-[0.07]", rotate: "-8deg" },
    { x: "15%", y: "82%", text: "√(a²+b²)", size: "text-2xl", opacity: "opacity-[0.06]", rotate: "12deg" },
    { x: "78%", y: "75%", text: "e^iπ + 1 = 0", size: "text-xl", opacity: "opacity-[0.07]", rotate: "-10deg" },
    { x: "42%", y: "90%", text: "∮", size: "text-5xl", opacity: "opacity-[0.05]", rotate: "5deg" },
    { x: "55%", y: "3%", text: "lim(x→∞)", size: "text-xl", opacity: "opacity-[0.06]", rotate: "-5deg" },
    { x: "68%", y: "55%", text: "∇²φ = 0", size: "text-lg", opacity: "opacity-[0.05]", rotate: "18deg" },
    { x: "30%", y: "18%", text: "α + β = γ", size: "text-xl", opacity: "opacity-[0.06]", rotate: "-12deg" },
    { x: "8%", y: "68%", text: "⊂ ∩ ∪", size: "text-2xl", opacity: "opacity-[0.05]", rotate: "8deg" },
    { x: "75%", y: "14%", text: "Δx → 0", size: "text-lg", opacity: "opacity-[0.06]", rotate: "-6deg" },
    { x: "48%", y: "60%", text: "⟨ψ|H|ψ⟩", size: "text-lg", opacity: "opacity-[0.04]", rotate: "15deg" },
    { x: "22%", y: "55%", text: "∞", size: "text-7xl", opacity: "opacity-[0.05]", rotate: "0deg" },
    { x: "60%", y: "85%", text: "d²y/dx²", size: "text-xl", opacity: "opacity-[0.06]", rotate: "-18deg" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {symbols.map((s, i) => (
        <div
          key={i}
          className={`absolute font-mono font-bold text-primary ${s.size} ${s.opacity} select-none`}
          style={{ left: s.x, top: s.y, transform: `rotate(${s.rotate})` }}
        >
          {s.text}
        </div>
      ))}
    </div>
  );
}

function DashboardPreview() {
  const classes = [
    { name: "Class 10A", subject: "Mathematics", cui: 85, trend: "improving", students: 24 },
    { name: "Class 9B", subject: "Science", cui: 63, trend: "stable", students: 18 },
    { name: "Class 11C", subject: "English", cui: 91, trend: "improving", students: 20 },
  ];

  const getColor = (cui: number) =>
    cui >= 80 ? "#22c55e" : cui >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-20 mb-6 z-10">
      <div className="text-center mb-8">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-wide mb-3">
          LIVE PREVIEW
        </span>
        <h2 className="text-3xl font-display font-extrabold text-foreground">
          See Your Class Analytics At A Glance
        </h2>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          The Class Understanding Index (CUI) gives you instant insight into how well each class is absorbing the material.
        </p>
      </div>

      <div className="bg-card/70 backdrop-blur-2xl border border-border rounded-[2rem] p-8 shadow-2xl">
        {/* Fake header bar */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-secondary rounded-lg h-7 flex items-center px-3">
            <span className="text-xs text-muted-foreground font-mono">intelliteach.app/dashboard</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Classes", value: "3", color: "text-indigo-500", bg: "bg-indigo-500/10" },
            { label: "Students", value: "62", color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Tests", value: "8", color: "text-cyan-500", bg: "bg-cyan-500/10" },
            { label: "Avg CUI", value: "79.7%", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-black ${s.color} mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {classes.map(c => (
            <div key={c.name} className="bg-background/60 border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-bold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.subject} · {c.students} students</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.trend === "improving" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {c.trend}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={getColor(c.cui)} strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(c.cui / 100) * 87.96} 87.96`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-foreground">
                    {c.cui}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Understanding</span>
                    <span className="font-bold" style={{ color: getColor(c.cui) }}>{c.cui}%</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${c.cui}%`, backgroundColor: getColor(c.cui) }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MathBackground />

      {/* Gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[35%] h-[35%] bg-accent/15 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] w-[25%] h-[25%] bg-indigo-400/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 pt-16 pb-24">
        {/* Hero */}
        <div className="text-center mb-14 animate-in slide-in-from-bottom-8 duration-700 fade-in max-w-4xl">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold tracking-wide text-sm">
            EDUCATION PLATFORM 2.0
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground tracking-tight leading-tight">
            Intelligent{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Teacher
            </span>{" "}
            Assistant
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto font-medium leading-relaxed">
            Empowering educators with AI-driven insights, automated grading intelligence,
            and real-time class understanding metrics powered by data.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {["Class Understanding Index", "MCQ & Structured Tests", "AI Question Flagging", "Paper OCR Upload"].map(f => (
              <span key={f} className="px-4 py-1.5 bg-secondary border border-border rounded-full text-sm font-semibold text-foreground">
                ✦ {f}
              </span>
            ))}
          </div>
        </div>

        {/* Portal cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 max-w-4xl w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <Link href="/dashboard" className="group">
            <div className="bg-card/80 backdrop-blur-xl border-2 border-border rounded-[2rem] p-10 shadow-2xl transition-all duration-300 hover:border-primary hover:shadow-primary/20 hover:-translate-y-2 flex flex-col items-center text-center cursor-pointer h-full">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                <img
                  src={`${import.meta.env.BASE_URL}images/teacher-avatar.png`}
                  className="w-36 h-36 rounded-full relative z-10 ring-8 ring-card shadow-xl group-hover:scale-105 transition-transform duration-300 object-cover"
                  alt="Teacher"
                />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground">I am a Teacher</h2>
              <p className="text-muted-foreground mt-3 text-base leading-relaxed max-w-xs">
                Manage classes, build MCQ & structured tests, view AI-flagged insights and upload papers.
              </p>
              <div className="mt-8 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl w-full group-hover:bg-primary/90 transition-colors">
                Enter Dashboard →
              </div>
            </div>
          </Link>

          <Link href="/student" className="group">
            <div className="bg-card/80 backdrop-blur-xl border-2 border-border rounded-[2rem] p-10 shadow-2xl transition-all duration-300 hover:border-accent hover:shadow-accent/20 hover:-translate-y-2 flex flex-col items-center text-center cursor-pointer h-full">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                <img
                  src={`${import.meta.env.BASE_URL}images/student-avatar.png`}
                  className="w-36 h-36 rounded-full relative z-10 ring-8 ring-card shadow-xl group-hover:scale-105 transition-transform duration-300 object-cover"
                  alt="Student"
                />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground">I am a Student</h2>
              <p className="text-muted-foreground mt-3 text-base leading-relaxed max-w-xs">
                Enter your student code to access your class tests. Answer MCQ or write structured responses.
              </p>
              <div className="mt-8 px-6 py-3 bg-accent text-accent-foreground font-semibold rounded-xl w-full group-hover:bg-accent/90 transition-colors">
                Student Portal →
              </div>
            </div>
          </Link>
        </div>

        {/* Dashboard Preview */}
        <DashboardPreview />
      </div>
    </div>
  );
}
