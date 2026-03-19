import { useState, useRef } from "react";
import { useGetUploads, useUploadPaper, useGetClasses, useProcessOCR } from "@workspace/api-client-react";
import { LoadingScreen } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, File, RefreshCw, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Uploads() {
  const { data: uploads, isLoading } = useGetUploads();
  const { data: classes } = useGetClasses();
  const uploadMut = useUploadPaper();
  const ocrMut = useProcessOCR();
  const queryClient = useQueryClient();

  const [isUploading, setIsUploading] = useState(false);
  const [classId, setClassId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <LoadingScreen />;

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0] || !classId) return;
    
    uploadMut.mutate({
      data: {
        file: fileInputRef.current.files[0],
        classId: Number(classId),
        description: "Scanned Paper"
      }
    }, {
      onSuccess: () => {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setClassId("");
        queryClient.invalidateQueries({ queryKey: ['/api/uploads'] });
      }
    });
  };

  const handleOCR = (id: number) => {
    ocrMut.mutate({ uploadId: id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/uploads'] })
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">Paper Uploads</h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">Upload handwritten tests for AI processing.</p>
        </div>
        <Button onClick={() => setIsUploading(!isUploading)} className="rounded-xl px-6 h-12 shadow-lg shadow-primary/20">
          <UploadCloud className="w-5 h-5 mr-2" />
          {isUploading ? "Cancel" : "Upload Paper"}
        </Button>
      </div>

      {isUploading && (
        <Card className="border-primary ring-4 ring-primary/10 mb-8 overflow-hidden animate-in slide-in-from-top-4">
          <div className="h-2 w-full bg-primary" />
          <CardContent className="p-8">
            <h2 className="text-2xl font-display font-bold mb-6">Upload New Paper</h2>
            <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Target Class</label>
                <select 
                  required
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                >
                  <option value="" disabled>Select Class</option>
                  {classes?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Select File (Image/PDF)</label>
                <Input 
                  required 
                  type="file"
                  ref={fileInputRef}
                  className="h-12 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </div>
              <div className="md:col-span-2 flex justify-end mt-4">
                <Button type="submit" disabled={uploadMut.isPending} className="h-12 px-8 rounded-xl">
                  {uploadMut.isPending ? "Uploading..." : "Upload & Process"}
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
                  <th className="p-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">File</th>
                  <th className="p-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">Class</th>
                  <th className="p-5 font-bold text-muted-foreground text-sm uppercase tracking-wider">Date</th>
                  <th className="p-5 font-bold text-muted-foreground text-sm uppercase tracking-wider text-right">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {uploads?.map((up) => (
                  <tr key={up.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-5 flex items-center gap-3">
                       <div className="p-2 bg-secondary rounded-lg text-muted-foreground"><File className="w-5 h-5"/></div>
                       <span className="font-semibold">{up.originalName}</span>
                    </td>
                    <td className="p-5 font-medium">{up.className || `Class ${up.classId}`}</td>
                    <td className="p-5 text-muted-foreground text-sm">{new Date(up.uploadedAt).toLocaleDateString()}</td>
                    <td className="p-5 text-right">
                       {up.ocrStatus === 'completed' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full"><CheckCircle className="w-3.5 h-3.5"/> PROCESSED</span>}
                       {up.ocrStatus === 'processing' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 font-bold text-xs rounded-full"><RefreshCw className="w-3.5 h-3.5 animate-spin"/> PROCESSING</span>}
                       {up.ocrStatus === 'pending' && (
                         <Button size="sm" variant="outline" onClick={() => handleOCR(up.id)} disabled={ocrMut.isPending} className="font-bold text-xs h-8">
                           Run OCR
                         </Button>
                       )}
                       {up.ocrStatus === 'failed' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full">FAILED</span>}
                    </td>
                  </tr>
                ))}
                {(!uploads || uploads.length === 0) && (
                  <tr><td colSpan={4} className="p-12 text-center text-muted-foreground font-medium">No files uploaded yet.</td></tr>
                )}
              </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
}
