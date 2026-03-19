import { Link, useLocation } from "wouter";
import { BookOpen, LogOut, UserCircle } from "lucide-react";
import { useStudent } from "@/context/StudentContext";
import { Button } from "@/components/ui/button";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { studentCode, logout } = useStudent();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/student/tests" className="flex items-center gap-3 group">
            <div className="bg-accent/10 p-2 rounded-xl text-accent group-hover:bg-accent/20 transition-colors">
               <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Student <span className="text-accent">Portal</span>
            </h1>
          </Link>
          
          {studentCode && (
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
                 <UserCircle className="w-5 h-5 text-muted-foreground" />
                 <span className="font-semibold text-sm text-foreground">{studentCode}</span>
              </div>
              <Button variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>
    </div>
  );
}
