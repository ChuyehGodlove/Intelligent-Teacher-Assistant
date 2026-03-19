import { useState } from "react";
import { useLocation } from "wouter";
import { useStudent } from "@/context/StudentContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";

export default function StudentLogin() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setStudentInfo } = useStudent();
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/students/lookup?code=${encodeURIComponent(trimmedCode)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError(`Student code "${trimmedCode}" was not found. Please check with your teacher.`);
        } else {
          setError("An error occurred. Please try again.");
        }
        setLoading(false);
        return;
      }
      const student = await res.json();
      setStudentInfo({
        studentCode: student.studentCode,
        studentId: student.id,
        studentName: student.name,
        classId: student.classId,
        className: student.className,
      });
      setLocation("/student/tests");
    } catch {
      setError("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center -mt-20">
      <Card className="w-full max-w-md border-border/50 shadow-2xl rounded-[2rem] overflow-hidden">
        <div className="h-3 w-full bg-gradient-to-r from-accent to-primary" />
        <CardContent className="p-10 text-center">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <img src={`${import.meta.env.BASE_URL}images/student-avatar.png`} alt="Student" className="w-16 h-16 rounded-full" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome, Student</h1>
          <p className="text-muted-foreground mb-8">Enter your student code to access your assigned tests.</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Input
                required
                disabled={loading}
                value={code}
                onChange={e => { setCode(e.target.value); setError(""); }}
                className="h-16 text-center text-2xl font-bold tracking-widest rounded-2xl border-2 focus-visible:ring-accent"
                placeholder="e.g. STU001"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-left">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-lg font-bold shadow-lg shadow-accent/25"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</>
              ) : (
                "Access Portal"
              )}
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            Don't know your code? Ask your teacher for your Student ID.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
