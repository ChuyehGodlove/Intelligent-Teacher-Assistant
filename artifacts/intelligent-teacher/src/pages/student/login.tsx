import { useState } from "react";
import { useLocation } from "wouter";
import { useStudent } from "@/context/StudentContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function StudentLogin() {
  const [code, setCode] = useState("");
  const { setStudentCode } = useStudent();
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      setStudentCode(code.trim().toUpperCase());
      setLocation("/student/tests");
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
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome Student</h1>
            <p className="text-muted-foreground mb-8">Enter your student code to access your tests.</p>
            
            <form onSubmit={handleLogin} className="space-y-6">
               <div>
                 <Input 
                   required
                   value={code}
                   onChange={e => setCode(e.target.value)}
                   className="h-16 text-center text-2xl font-bold tracking-widest rounded-2xl border-2 focus-visible:ring-accent"
                   placeholder="e.g. STU001"
                 />
               </div>
               <Button type="submit" className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-lg font-bold shadow-lg shadow-accent/25">
                 Access Portal
               </Button>
            </form>
         </CardContent>
       </Card>
    </div>
  )
}
