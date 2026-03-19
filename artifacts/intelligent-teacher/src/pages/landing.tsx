import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background Image */}
      <img 
        src={`${import.meta.env.BASE_URL}images/landing-bg.png`} 
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" 
        alt="Background" 
      />
      
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="z-10 text-center mb-16 animate-in slide-in-from-bottom-8 duration-700 fade-in">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold tracking-wide text-sm">
          EDUCATION PLATFORM 2.0
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground tracking-tight max-w-4xl mx-auto leading-tight">
          Intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Teacher</span> Assistant
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto font-medium">
          Empowering educators with AI-driven insights, streamlined grading, and comprehensive class understanding metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 max-w-4xl w-full">
        <Link href="/dashboard" className="group">
          <div className="bg-card/80 backdrop-blur-xl border-2 border-border rounded-[2rem] p-10 shadow-2xl transition-all duration-300 hover:border-primary hover:shadow-primary/20 hover:-translate-y-2 flex flex-col items-center text-center cursor-pointer">
             <div className="relative mb-8">
               <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
               <img src={`${import.meta.env.BASE_URL}images/teacher-avatar.png`} className="w-40 h-40 rounded-full relative z-10 ring-8 ring-card shadow-xl group-hover:scale-105 transition-transform duration-300" alt="Teacher" />
             </div>
             <h2 className="text-3xl font-display font-bold text-foreground">I am a Teacher</h2>
             <p className="text-muted-foreground mt-3 text-lg">Manage classes, create tests, and view AI insights.</p>
             <div className="mt-8 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl w-full group-hover:bg-primary/90 transition-colors">
               Enter Dashboard
             </div>
          </div>
        </Link>

        <Link href="/student" className="group">
          <div className="bg-card/80 backdrop-blur-xl border-2 border-border rounded-[2rem] p-10 shadow-2xl transition-all duration-300 hover:border-accent hover:shadow-accent/20 hover:-translate-y-2 flex flex-col items-center text-center cursor-pointer">
             <div className="relative mb-8">
               <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
               <img src={`${import.meta.env.BASE_URL}images/student-avatar.png`} className="w-40 h-40 rounded-full relative z-10 ring-8 ring-card shadow-xl group-hover:scale-105 transition-transform duration-300" alt="Student" />
             </div>
             <h2 className="text-3xl font-display font-bold text-foreground">I am a Student</h2>
             <p className="text-muted-foreground mt-3 text-lg">Take assigned tests and track your progress.</p>
             <div className="mt-8 px-6 py-3 bg-accent text-accent-foreground font-semibold rounded-xl w-full group-hover:bg-accent/90 transition-colors">
               Student Portal
             </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
