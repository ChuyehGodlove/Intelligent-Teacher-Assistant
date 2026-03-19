import { Link, useLocation } from "wouter";
import { useGetTests } from "@workspace/api-client-react";
import { useStudent } from "@/context/StudentContext";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, PlayCircle, User, BookOpen } from "lucide-react";
import { useEffect } from "react";

export default function StudentTests() {
  const { studentCode, studentInfo } = useStudent();
  const [, setLocation] = useLocation();

  const classId = studentInfo?.classId;
  const { data: tests, isLoading } = useGetTests(
    classId ? { classId } : undefined,
    { query: { enabled: !!studentCode } }
  );

  useEffect(() => {
    if (!studentCode) setLocation("/student");
  }, [studentCode, setLocation]);

  if (isLoading) return <LoadingScreen />;

  const activeTests = tests?.filter(t => t.isActive) ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">
            Your Tests
          </h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">
            Tests assigned to your class
            {studentInfo?.className ? ` — ${studentInfo.className}` : ""}.
          </p>
        </div>
        {studentInfo?.studentName && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm font-semibold">
            <User className="w-4 h-4 text-muted-foreground" />
            {studentInfo.studentName}
          </div>
        )}
      </div>

      {!classId && (
        <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-800 text-sm font-medium flex items-center gap-3">
          <BookOpen className="w-5 h-5 shrink-0" />
          Your class information could not be loaded. Some tests may not be visible. Please re-login.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTests.map(test => (
          <Card
            key={test.id}
            className="border-border shadow-md hover:shadow-xl transition-all duration-300 rounded-[1.5rem] overflow-hidden group"
          >
            <CardContent className="p-8 flex flex-col h-full">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-4 leading-tight">
                {test.title}
              </h3>

              <div className="mt-auto space-y-3 mb-8 text-sm font-semibold text-muted-foreground">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" /> {test.questionCount} Questions
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4" /> {test.durationMinutes} Minutes
                </div>
              </div>

              <Link href={`/student/tests/${test.id}`}>
                <button className="w-full py-4 rounded-xl bg-accent text-accent-foreground font-bold flex items-center justify-center gap-2 group-hover:bg-accent/90 transition-colors shadow-lg shadow-accent/25">
                  <PlayCircle className="w-5 h-5" /> Start Test
                </button>
              </Link>
            </CardContent>
          </Card>
        ))}

        {activeTests.length === 0 && (
          <div className="col-span-full p-16 text-center border-2 border-dashed border-border rounded-3xl bg-secondary/20">
            <div className="mx-auto w-16 h-16 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">No Active Tests</h3>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              No tests are currently assigned to your class. Check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
