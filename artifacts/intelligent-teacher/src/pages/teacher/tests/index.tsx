import { Link } from "wouter";
import { useGetTests } from "@workspace/api-client-react";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Clock, LayoutList } from "lucide-react";

export default function Tests() {
  const { data: tests, isLoading } = useGetTests();

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">MCQ Tests</h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Create and manage multiple choice tests.</p>
        </div>
        <Link href="/tests/create">
          <Button className="rounded-xl px-6 h-12 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" />
            Create New Test
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tests?.map((test) => (
          <Link key={test.id} href={`/tests/${test.id}`}>
            <Card className="hover:shadow-xl hover:border-primary/50 transition-all duration-300 cursor-pointer h-full group flex flex-col border-border/80">
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  {test.isActive ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">Active</span>
                  ) : (
                    <span className="px-3 py-1 bg-secondary text-muted-foreground rounded-full text-xs font-bold uppercase">Closed</span>
                  )}
                </div>
                
                <h3 className="text-2xl font-display font-bold text-foreground mb-2 leading-tight">{test.title}</h3>
                <p className="text-muted-foreground font-medium mb-6">Class: {test.className || test.classId}</p>
                
                <div className="mt-auto pt-6 border-t border-border grid grid-cols-2 gap-4 text-sm font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <LayoutList className="w-4 h-4 text-muted-foreground" />
                    {test.questionCount} Questions
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {test.durationMinutes} Mins
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!tests || tests.length === 0) && (
          <div className="col-span-full p-16 text-center border-2 border-dashed border-border rounded-3xl bg-secondary/20">
            <div className="mx-auto w-16 h-16 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2">No Tests Found</h3>
            <p className="text-muted-foreground font-medium mb-6 max-w-sm mx-auto">Create your first multiple choice test to assess your students.</p>
            <Link href="/tests/create">
              <Button className="rounded-xl px-8 h-12">Create Test</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
