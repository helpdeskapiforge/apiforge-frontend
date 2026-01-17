"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Clock, Loader2, AlertCircle } from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

export default function HistoryViewer({ historyId }: { historyId: number }) {
  const { openRequest, activeWorkspaceId } = useDashboard();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (historyId) loadDetails();
  }, [historyId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
        // Backend workaround: Fetch list and find item client-side
        const res = await api.get("/history/me");
        const found = res.data.find((h: any) => h.id === historyId);
        setEntry(found || null);
    } catch (e) {
        console.error("Error loading history item", e);
    } finally {
        setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!entry || !activeWorkspaceId) return;
    setRestoring(true);

    try {
        // 1. Find a collection to place this request in (Default to first one)
        const colRes = await api.get(`/collections/workspace/${activeWorkspaceId}`);
        if (!colRes.data || colRes.data.length === 0) {
            alert("No collections found in this workspace. Please create a collection first to restore requests.");
            return;
        }
        const targetCollectionId = colRes.data[0].id;

        // 2. Create the new request
        const res = await api.post("/requests/create", {
            workspaceId: activeWorkspaceId,
            collectionId: targetCollectionId,
            name: `Restored ${entry.method} - ${new Date().toLocaleTimeString()}`,
            method: entry.method,
            url: entry.url,
            // Handle headers safely (backend expects JSON string)
            headers: typeof entry.reqHeaders === 'object' 
                ? JSON.stringify(entry.reqHeaders) 
                : (entry.reqHeaders || "{}"),
            body: entry.reqBody || "",
            // Default auth to none as history doesn't usually store raw auth creds securely
            authConfig: JSON.stringify({ type: "none" }) 
        });

        // 3. Switch to the new request
        if (res.data && res.data.id) {
            openRequest(res.data.id);
        }

    } catch (e) {
        console.error("Failed to restore request", e);
        alert("Failed to restore request. Check console for details.");
    } finally {
        setRestoring(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin"/> Loading...</div>;
  
  if (!entry) return <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2"><AlertCircle className="h-6 w-6"/><span>History item not found.</span></div>;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-muted/5">
         <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase">
            <Clock className="h-4 w-4" /> History Detail #{entry.id}
         </div>
         <Button size="sm" onClick={handleRestore} disabled={restoring} className="gap-2">
            {restoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            Restore to Editor
         </Button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 overflow-y-auto flex-1">
         {/* Summary Card */}
         <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg border">
            <div>
                <label className="text-xs text-muted-foreground uppercase font-bold">Method</label>
                <div className={`font-mono font-bold ${
                    entry.method === "GET" ? "text-green-600" : 
                    entry.method === "POST" ? "text-blue-600" : "text-orange-600"
                }`}>{entry.method}</div>
            </div>
            <div>
                <label className="text-xs text-muted-foreground uppercase font-bold">Status</label>
                <div className={`font-mono font-bold ${entry.status >= 400 ? "text-red-500" : "text-green-600"}`}>
                    {/* Note: Your previous code used 'statusCode' or 'status'. Verify your API response key. Usually 'status' in history model based on your controller. */}
                    {entry.status || entry.statusCode}
                </div>
            </div>
            <div>
                <label className="text-xs text-muted-foreground uppercase font-bold">Time</label>
                <div className="font-mono text-sm">{new Date(entry.timestamp).toLocaleString()}</div>
            </div>
         </div>

         {/* URL */}
         <div>
            <label className="text-xs text-muted-foreground uppercase font-bold">Request URL</label>
            <div className="p-3 border rounded font-mono text-xs bg-muted/10 mt-1 break-all select-text">
                {entry.url}
            </div>
         </div>

         {/* Headers */}
         {entry.reqHeaders && (
             <div>
                <label className="text-xs text-muted-foreground uppercase font-bold">Headers</label>
                <pre className="mt-1 p-3 border rounded bg-muted/10 font-mono text-xs overflow-auto max-h-[200px]">
                    {typeof entry.reqHeaders === 'string' ? entry.reqHeaders : JSON.stringify(entry.reqHeaders, null, 2)}
                </pre>
             </div>
         )}

         {/* Body */}
         {entry.reqBody && (
             <div>
                <label className="text-xs text-muted-foreground uppercase font-bold">Request Body</label>
                <pre className="mt-1 p-3 border rounded bg-muted/10 font-mono text-xs overflow-auto max-h-[300px]">
                    {entry.reqBody}
                </pre>
             </div>
         )}
      </div>
    </div>
  );
}