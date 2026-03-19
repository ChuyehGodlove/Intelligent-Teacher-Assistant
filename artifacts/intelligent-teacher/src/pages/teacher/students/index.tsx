import { useState } from "react";
import { useGetStudents, useCreateStudent, useGetClasses } from "@workspace/api-client-react";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Students() {
  const { data: students, isLoading } = useGetStudents();
  const { data: classes } = useGetClasses();
  const createMut = useCreateStudent();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", classId: "" });

  if (isLoading) return <LoadingScreen />;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ 
      data: { ...formData, classId: Number(formData.classId) } 
    }, {
      onSuccess: () => {
        setIsCreating(false);
        setFormData({ name: "", email: "", classId: "" });
        queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">Students</h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Manage all students across your classes.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="rounded-xl px-6 h-12 shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5 mr-2" />
          {isCreating ? "Cancel" : "Add Student"}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary ring-4 ring-primary/10 mb-8 overflow-hidden animate-in slide-in-from-top-4">
          <div className="h-2 w-full bg-primary" />
          <CardContent className="p-8">
            <h2 className="text-2xl font-display font-bold mb-6">Enroll New Student</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Full Name</label>
                <Input 
                  required 
                  placeholder="e.g. John Doe" 
                  className="h-12 rounded-xl"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email</label>
                <Input 
                  required 
                  type="email"
                  placeholder="e.g. john@example.com" 
                  className="h-12 rounded-xl"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Assign to Class</label>
                <select 
                  required
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={formData.classId}
                  onChange={e => setFormData({...formData, classId: e.target.value})}
                >
                  <option value="" disabled>Select Class</option>
                  {classes?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={createMut.isPending} className="h-12 px-8 rounded-xl">
                  {createMut.isPending ? "Creating..." : "Save Student"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden shadow-sm border-border/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="p-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">Student Code</th>
                <th className="p-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">Name</th>
                <th className="p-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">Email</th>
                <th className="p-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students?.map((student) => (
                <tr key={student.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="p-5">
                    <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-lg text-sm">
                      {student.studentCode}
                    </span>
                  </td>
                  <td className="p-5 font-bold text-foreground">{student.name}</td>
                  <td className="p-5 text-muted-foreground">{student.email}</td>
                  <td className="p-5 font-medium">{student.className || `Class ID: ${student.classId}`}</td>
                </tr>
              ))}
              {(!students || students.length === 0) && (
                <tr><td colSpan={4} className="p-12 text-center text-muted-foreground font-medium">No students enrolled yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
