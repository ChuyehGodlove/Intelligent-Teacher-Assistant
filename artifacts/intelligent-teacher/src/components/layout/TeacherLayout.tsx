import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, BookOpen, FileText, Upload, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/classes", icon: BookOpen, label: "Classes" },
    { href: "/students", icon: Users, label: "Students" },
    { href: "/tests", icon: FileText, label: "Tests" },
    { href: "/uploads", icon: Upload, label: "Paper Uploads" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
       {/* Sidebar */}
       <aside className="w-72 bg-card border-r border-border flex flex-col shadow-xl shadow-black/5 z-20 shrink-0">
          <div className="p-8 border-b border-border flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-2xl text-primary shadow-inner">
               <BookOpen className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground tracking-tight">
              Intelli<span className="text-primary">Teach</span>
            </h1>
          </div>
          
          <div className="px-6 py-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Main Menu</p>
          </div>
          
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200", 
                    isActive ? "text-primary-foreground scale-110" : "text-muted-foreground group-hover:scale-110"
                  )} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
          <div className="p-6 border-t border-border mt-auto">
             <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200">
               <LogOut className="w-5 h-5" />
               Exit Dashboard
             </Link>
          </div>
       </aside>

       {/* Main Content */}
       <main className="flex-1 overflow-auto relative scroll-smooth">
         <div className="max-w-7xl mx-auto p-8 lg:p-12">
           {children}
         </div>
       </main>
    </div>
  )
}
