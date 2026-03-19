import { useState } from "react";
import { Link } from "wouter";
import { useGetClasses, useCreateClass } from "@workspace/api-client-react";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, BookOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Classes() {
  const { data: classes, isLoading } = useGetClasses();
  const createMut = useCreateClass();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", subject: "", grade: "" });

  if (isLoading) return <LoadingScreen />;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ data: formData }, {
      onSuccess: () => {
        setIsCreating(false);
        setFormData({ name: "", subject: "", grade: "" });
        queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">Classes</h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Manage your class roster and subjects.</p>
        </div>
        <Button 
          onClick={() => setIsCreating(!isCreating)} 
          className="rounded-xl px-6 h-12 shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          {isCreating ? "Cancel" : "Add New Class"}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary ring-4 ring-primary/10 mb-8 overflow-hidden animate-in slide-in-from-top-4">
          <div className="h-2 w-full bg-primary" />
          <CardContent className="p-8">
            <h2 className="text-2xl font-display font-bold mb-6">Create New Class</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Class Name</label>
                <Input 
                  required 
                  placeholder="e.g. Physics 101" 
                  className="h-12 rounded-xl"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Subject</label>
                <Input 
                  required 
                  placeholder="e.g. Science" 
                  className="h-12 rounded-xl"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Grade Level</label>
                <Input 
                  required 
                  placeholder="e.g. 10th Grade" 
                  className="h-12 rounded-xl"
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value})}
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <Button type="submit" disabled={createMut.isPending} className="h-12 px-8 rounded-xl">
                  {createMut.isPending ? "Creating..." : "Save Class"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes?.map((cls) => (
          <Link key={cls.id} href={`/classes/${cls.id}`}>
            <Card className="hover:shadow-xl hover:border-primary/50 transition-all duration-300 cursor-pointer h-full group flex flex-col">
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="p-3 bg-secondary rounded-2xl w-fit mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground">{cls.name}</h3>
                <div className="mt-2 space-y-1 text-sm font-medium text-muted-foreground flex-1">
                  <p>Subject: <span className="text-foreground">{cls.subject}</span></p>
                  <p>Grade: <span className="text-foreground">{cls.grade}</span></p>
                </div>
                <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-sm font-bold">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-5 h-5" />
                    {cls.studentCount} Enrolled
                  </div>
                  <span className="text-primary group-hover:translate-x-1 transition-transform">View Details &rarr;</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {classes?.length === 0 && !isCreating && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-2xl">
            <h3 className="text-xl font-bold mb-2">No Classes Yet</h3>
            <p className="text-muted-foreground">Click the 'Add New Class' button to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
