import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useGetClasses } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Mail, Hash, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

type PageRole = "teacher" | "student";
type StudentMode = "email" | "class-code";
type FormMode = "signup" | "login";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { loginTeacher, loginStudent, isTeacher, isStudent } = useAuth();
  const { data: classes } = useGetClasses();

  const [formMode, setFormMode] = useState<FormMode>("signup");
  const [role, setRole] = useState<PageRole>("teacher");
  const [studentMode, setStudentMode] = useState<StudentMode>("email");

  // Shared fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [classId, setClassId] = useState("");

  // Class-code-only signup
  const [classCodeName, setClassCodeName] = useState("");
  const [classCodeClassId, setClassCodeClassId] = useState("");

  const [error, setError] = useState("");
  const [successCode, setSuccessCode] = useState(""); // for class-code signup
  const [loading, setLoading] = useState(false);

  const base = import.meta.env.BASE_URL;

  // Redirect if already logged in
  useEffect(() => {
    if (isTeacher) setLocation("/dashboard");
    if (isStudent) setLocation("/student/tests");
  }, [isTeacher, isStudent]);

  const reset = () => { setError(""); setSuccessCode(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);

    try {
      if (formMode === "signup") {
        if (role === "teacher") {
          const res = await fetch(`${base}api/auth/signup/teacher`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          const data = await res.json();
          if (!res.ok) { setError(data.error ?? "Signup failed"); setLoading(false); return; }
          loginTeacher(data.token, data.user);
          setLocation("/dashboard");
        } else if (studentMode === "email") {
          const res = await fetch(`${base}api/auth/signup/student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, classId: classId ? Number(classId) : undefined }),
          });
          const data = await res.json();
          if (!res.ok) { setError(data.error ?? "Signup failed"); setLoading(false); return; }
          loginStudent(data.token, data.user);
          setLocation("/student/tests");
        } else {
          // Class-code signup (no password)
          const res = await fetch(`${base}api/auth/signup/student/by-class`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: classCodeName, classId: Number(classCodeClassId) }),
          });
          const data = await res.json();
          if (!res.ok) { setError(data.error ?? "Signup failed"); setLoading(false); return; }
          setSuccessCode(data.studentCode);
        }
      } else {
        // Login
        const endpoint = role === "teacher" ? `${base}api/auth/login/teacher` : `${base}api/auth/login/student`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Login failed"); setLoading(false); return; }
        if (role === "teacher") {
          loginTeacher(data.token, data.user);
          setLocation("/dashboard");
        } else {
          loginStudent(data.token, data.user);
          setLocation("/student/tests");
        }
      }
    } catch {
      setError("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (successCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="h-3 bg-gradient-to-r from-accent to-emerald-400" />
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Account Created!</h2>
            <p className="text-muted-foreground mb-6">
              Share this student code with your student. They'll use it to log in to the portal.
            </p>
            <div className="bg-secondary rounded-2xl p-6 mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Student Code</p>
              <p className="text-5xl font-black text-foreground tracking-widest">{successCode}</p>
            </div>
            <Link href="/student">
              <Button className="w-full h-12 rounded-xl">Go to Student Portal</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-primary/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors">
          ← Back to home
        </Link>

        <Card className="rounded-[2rem] shadow-2xl overflow-hidden border-border/50">
          <div className="h-3 bg-gradient-to-r from-primary to-accent" />
          <CardContent className="p-8">
            {/* Signup / Login toggle */}
            <div className="flex bg-secondary rounded-2xl p-1 mb-8 gap-1">
              {(["signup", "login"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setFormMode(m); reset(); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                    formMode === m
                      ? "bg-card shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m === "signup" ? "Create Account" : "Sign In"}
                </button>
              ))}
            </div>

            {/* Role toggle */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => { setRole("teacher"); reset(); }}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  role === "teacher"
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === "teacher" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className={`text-sm font-bold ${role === "teacher" ? "text-primary" : "text-muted-foreground"}`}>
                  Teacher
                </span>
              </button>

              <button
                onClick={() => { setRole("student"); reset(); }}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  role === "student"
                    ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                    : "border-border hover:border-accent/40"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === "student" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className={`text-sm font-bold ${role === "student" ? "text-accent" : "text-muted-foreground"}`}>
                  Student
                </span>
              </button>
            </div>

            {/* Student signup mode sub-toggle */}
            {role === "student" && formMode === "signup" && (
              <div className="flex bg-secondary rounded-xl p-1 mb-6 gap-1">
                <button
                  onClick={() => setStudentMode("email")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                    studentMode === "email" ? "bg-card shadow text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> Email Signup
                </button>
                <button
                  onClick={() => setStudentMode("class-code")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                    studentMode === "class-code" ? "bg-card shadow text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" /> Enter Class ID
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Class-code-only form */}
              {role === "student" && formMode === "signup" && studentMode === "class-code" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Name</label>
                    <Input
                      required
                      disabled={loading}
                      value={classCodeName}
                      onChange={e => setClassCodeName(e.target.value)}
                      className="h-12 rounded-xl"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Your Class</label>
                    <select
                      required
                      disabled={loading}
                      className="flex h-12 w-full rounded-xl border border-input bg-background px-4 font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                      value={classCodeClassId}
                      onChange={e => setClassCodeClassId(e.target.value)}
                    >
                      <option value="" disabled>Choose a class...</option>
                      {classes?.map(c => (
                        <option key={c.id} value={c.id}>{c.name} — {c.subject}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No email required. You'll receive a student code to use for test access.
                  </p>
                </>
              ) : (
                <>
                  {/* Full form (teacher signup, student email signup, any login) */}
                  {formMode === "signup" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                      <Input
                        required
                        disabled={loading}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="h-12 rounded-xl"
                        placeholder="Enter your full name"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <Input
                      required
                      type="email"
                      disabled={loading}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-12 rounded-xl"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                    <div className="relative">
                      <Input
                        required
                        disabled={loading}
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="h-12 rounded-xl pr-12"
                        placeholder={formMode === "signup" ? "At least 6 characters" : "Enter your password"}
                        minLength={formMode === "signup" ? 6 : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Class selection for student email signup */}
                  {role === "student" && formMode === "signup" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Your Class <span className="text-muted-foreground/60 normal-case">(optional)</span>
                      </label>
                      <select
                        disabled={loading}
                        className="flex h-12 w-full rounded-xl border border-input bg-background px-4 font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                        value={classId}
                        onChange={e => setClassId(e.target.value)}
                      >
                        <option value="">No class yet...</option>
                        {classes?.map(c => (
                          <option key={c.id} value={c.id}>{c.name} — {c.subject}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className={`w-full h-13 rounded-xl text-base font-bold shadow-lg py-3 ${
                  role === "teacher"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25"
                    : "bg-accent hover:bg-accent/90 text-accent-foreground shadow-accent/25"
                }`}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Please wait...</>
                ) : formMode === "signup" ? (
                  role === "teacher" ? "Create Teacher Account" :
                    studentMode === "class-code" ? "Get My Student Code" : "Create Student Account"
                ) : (
                  `Sign In as ${role === "teacher" ? "Teacher" : "Student"}`
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {formMode === "signup" ? (
                <>Already have an account?{" "}
                  <button onClick={() => { setFormMode("login"); reset(); }} className="text-primary font-semibold hover:underline">
                    Sign in
                  </button>
                </>
              ) : (
                <>Don't have an account?{" "}
                  <button onClick={() => { setFormMode("signup"); reset(); }} className="text-primary font-semibold hover:underline">
                    Create one
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
