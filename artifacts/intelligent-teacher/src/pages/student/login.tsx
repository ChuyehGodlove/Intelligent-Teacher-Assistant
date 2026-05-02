import { useState } from "react";
import { useLocation } from "wouter";
import { useStudent } from "@/context/StudentContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertCircle, Loader2, BookOpen, CheckCircle2,
  User, ChevronRight, ArrowLeft, GraduationCap,
} from "lucide-react";

const base = import.meta.env.BASE_URL;

interface StudentData {
  id: number;
  name: string;
  studentCode: string;
  classId: number;
  className: string;
  email?: string;
}

interface ClassOption {
  id: number;
  name: string;
  subject: string;
  grade: string;
  classCode: string;
}

type Step = "code" | "class";

export default function StudentLogin() {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // After code lookup
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classError, setClassError] = useState("");

  const { setStudentInfo } = useStudent();
  const [, setLocation] = useLocation();

  // Step 1: Verify the student code
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      const [studentRes, classesRes] = await Promise.all([
        fetch(`${base}api/students/lookup?code=${encodeURIComponent(trimmed)}`),
        fetch(`${base}api/classes`),
      ]);

      if (!studentRes.ok) {
        setError(
          studentRes.status === 404
            ? `Student code "${trimmed}" was not found. Please check with your teacher.`
            : "An error occurred. Please try again."
        );
        setLoading(false);
        return;
      }

      const student: StudentData = await studentRes.json();
      const classes: ClassOption[] = classesRes.ok ? await classesRes.json() : [];

      setStudentData(student);
      setAllClasses(classes);
      // Pre-select the student's assigned class
      setSelectedClassId(student.classId);
      setStep("class");
    } catch {
      setError("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm class and enter portal
  const handleConfirm = () => {
    if (!studentData || !selectedClassId) return;
    setClassError("");

    const chosenClass = allClasses.find(c => c.id === selectedClassId);
    if (!chosenClass) {
      setClassError("Please select your class before continuing.");
      return;
    }

    // Verify the selected class matches the student's assigned class
    if (selectedClassId !== studentData.classId) {
      setClassError(
        `You are not enrolled in "${chosenClass.name}". Please select your correct class or contact your teacher.`
      );
      return;
    }

    setStudentInfo({
      studentCode: studentData.studentCode,
      studentId: studentData.id,
      studentName: studentData.name,
      classId: chosenClass.id,
      className: chosenClass.name,
    });
    setLocation("/student/dashboard");
  };

  return (
    <div className="flex-1 flex items-center justify-center -mt-16">
      <div className="w-full max-w-md">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {(["code", "class"] as Step[]).map((s, i) => {
            const active = step === s;
            const done = step === "class" && s === "code";
            return (
              <div key={s} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  done ? "bg-emerald-100 text-emerald-700"
                  : active ? "bg-primary text-primary-foreground shadow"
                  : "bg-secondary text-muted-foreground"
                }`}>
                  {done
                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                    : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                  }
                  {s === "code" ? "Student Code" : "Select Class"}
                </div>
                {i < 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        <Card className="border-border/50 shadow-2xl rounded-[2rem] overflow-hidden">
          <div className="h-3 w-full bg-gradient-to-r from-accent to-primary" />

          {/* ── Step 1: Enter student code ─────────────────────────────────── */}
          {step === "code" && (
            <CardContent className="p-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <img
                  src={`${base}images/student-avatar.png`}
                  alt="Student"
                  className="w-16 h-16 rounded-full"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    (e.currentTarget.parentElement as HTMLElement).innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
                  }}
                />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome, Student</h1>
              <p className="text-muted-foreground mb-8 text-sm">Enter your student code to get started.</p>

              <form onSubmit={handleLookup} className="space-y-5">
                <Input
                  required
                  autoFocus
                  disabled={loading}
                  value={code}
                  onChange={e => { setCode(e.target.value); setError(""); }}
                  className="h-16 text-center text-2xl font-bold tracking-widest rounded-2xl border-2 focus-visible:ring-accent"
                  placeholder="e.g. STU001"
                />

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-left">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-lg font-bold shadow-lg shadow-accent/25 gap-2"
                >
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                    : <><ChevronRight className="w-5 h-5" /> Continue</>
                  }
                </Button>
              </form>

              <p className="mt-6 text-xs text-muted-foreground">
                Don't know your code? Ask your teacher for your Student ID.
              </p>
            </CardContent>
          )}

          {/* ── Step 2: Select / confirm class ─────────────────────────────── */}
          {step === "class" && studentData && (
            <CardContent className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Student identity */}
              <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-2xl mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{studentData.name}</p>
                  <p className="text-xs font-semibold text-muted-foreground">{studentData.studentCode}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto shrink-0" />
              </div>

              <h2 className="text-xl font-display font-bold text-foreground mb-1">Select Your Class</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Choose the class you belong to. Contact your teacher if your class is missing.
              </p>

              {/* Class grid */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-5">
                {allClasses.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-2xl">
                    <BookOpen className="w-8 h-8 mx-auto mb-2" />
                    No classes available yet.
                  </div>
                ) : (
                  allClasses.map(cls => {
                    const isSelected = selectedClassId === cls.id;
                    const isAssigned = cls.id === studentData.classId;
                    return (
                      <button
                        key={cls.id}
                        onClick={() => { setSelectedClassId(cls.id); setClassError(""); }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow"
                            : "border-border/60 hover:border-primary/40 hover:bg-secondary/30"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}>
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground text-sm truncate">{cls.name}</p>
                            {isAssigned && (
                              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full uppercase tracking-wider">
                                Your class
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">
                            {cls.subject} · Grade {cls.grade}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              {classError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl mb-4 text-left">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">{classError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl gap-1.5"
                  onClick={() => { setStep("code"); setStudentData(null); setSelectedClassId(null); setClassError(""); }}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
                  onClick={handleConfirm}
                  disabled={!selectedClassId}
                >
                  <BookOpen className="w-4 h-4" /> Enter Portal
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
