"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { FileText, Clock, Copy, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogViewer({ logId }: { logId: number }) {
  const [log, setLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (logId) loadLog();
  }, [logId]);

  const loadLog = async () => {
     setLoading(true);
     const serverId = localStorage.getItem("currentLogServerId");
     
     if (!serverId) {
         setLoading(false);
         return;
     }

     try {
         // Workaround: Backend lacks /logs/{id}, so we fetch list by server and find item
         const res = await api.get(`/logs/server/${serverId}`);
         const found = res.data.find((l: any) => l.id === logId);
         setLog(found || null);
     } catch(e) {
         console.error(e);
     } finally {
         setLoading(false);
     }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2"/> Loading Details...</div>;
  if (!log) return <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2"><AlertCircle className="h-8 w-8 stroke-1"/><span>Select a log to view details</span></div>;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b flex items-center px-6 bg-muted/5 gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-bold text-sm text-muted-foreground uppercase">Mock Hit #{log.id}</span>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto flex-1">
        {/* Top Info Grid */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Method & Status</label>
                <div className="flex items-center gap-2 p-2 rounded border bg-muted/20">
                    <span className={`font-bold ${
                        log.method === "GET" ? "text-green-600" : 
                        log.method === "POST" ? "text-blue-600" : "text-orange-600"
                    }`}>{log.method}</span>
                    <div className="h-4 w-[1px] bg-border"></div>
                    <span className={`font-mono font-bold ${log.statusCode >= 400 ? "text-red-500" : "text-green-600"}`}>
                        {log.statusCode}
                    </span>
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Timestamp</label>
                <div className="flex items-center gap-2 text-sm font-mono bg-muted/20 p-2 rounded border">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {new Date(log.timestamp).toLocaleString()}
                </div>
            </div>
        </div>

        {/* Path */}
        <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Request Path</label>
            <div className="p-3 rounded border bg-muted/10 font-mono text-sm break-all select-all">
                {log.path}
            </div>
        </div>

        {/* Request Details (If available in MockLog model) */}
        {log.body && (
            <div className="space-y-1 flex-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Request Body</label>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(log.body)}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
                <pre className="p-4 rounded border bg-muted/50 font-mono text-xs overflow-auto max-h-[300px]">
                    {log.body}
                </pre>
            </div>
        )}
        
        {/* Generic Fallback for JSON Dump if specific fields missing */}
        <div className="pt-4 border-t">
            <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">View Raw Log Object</summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                    {JSON.stringify(log, null, 2)}
                </pre>
            </details>
        </div>
      </div>
    </div>
  );
}