import { Link, useLocation } from "wouter";
import { BookOpen, LogOut, UserCircle, LayoutDashboard, FileText } from "lucide-react";
import { useStudent } from "@/context/StudentContext";
import { Button } from "@/components/ui/button";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { studentCode, studentInfo, logout } = useStudent();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const isActive = (path: string) => location === path || location.startsWith(path + "/");

  const navLinks = studentCode ? [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/tests",     label: "Tests",     icon: FileText },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href={studentCode ? "/student/dashboard" : "/student"} className="flex items-center gap-2.5 group shrink-0">
            <div className="bg-accent/10 p-2 rounded-xl text-accent group-hover:bg-accent/20 transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold text-foreground leading-tight">
                Student <span className="text-accent">Portal</span>
              </h1>
              {studentInfo?.className && (
                <p className="text-[10px] text-muted-foreground font-medium leading-none">{studentInfo.className}</p>
              )}
            </div>
          </Link>

          {/* Nav links */}
          {navLinks.length > 0 && (
            <nav className="flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <button className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive(href)
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                </Link>
              ))}
            </nav>
          )}

          {/* User + logout */}
          {studentCode && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full">
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm text-foreground">
                  {studentInfo?.studentName ?? studentCode}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-1.5">Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
