"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { History, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HistoryEntry {
  id: number;
  method: string;
  url: string;
  statusCode: number;
  timestamp: string;
}

export default function HistoryExplorer() {
  const { setActiveEditor, setActiveEntityId, activeEntityId } = useDashboard();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
        // Backend only supports getting the authenticated user's history
        const res = await api.get("/history/me");
        setHistory(res.data);
    } catch(e) {
        console.error("Failed to load history", e);
    } finally {
        setLoading(false);
    }
  };

  const openHistoryItem = (id: number) => {
    setActiveEditor("history-viewer");
    setActiveEntityId(id);
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return "text-green-500";
    if (code >= 400 && code < 500) return "text-orange-500";
    return "text-red-500";
  };

  const filteredHistory = history.filter(item => 
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b space-y-2 shrink-0">
        <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Request History</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadHistory} disabled={loading}>
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
        </div>
        <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
                className="h-8 pl-8 text-xs bg-background" 
                placeholder="Search URL..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            onClick={() => openHistoryItem(item.id)}
            className={`group flex flex-col gap-1 p-2 rounded-md cursor-pointer text-xs mb-1 transition-colors ${
              activeEntityId === item.id
                ? "bg-primary/10 border-l-2 border-primary"
                : "text-muted-foreground hover:bg-muted border-l-2 border-transparent"
            }`}
          >
             <div className="flex items-center justify-between">
                <span className={`font-bold ${
                    item.method === "GET" ? "text-green-600" : 
                    item.method === "POST" ? "text-blue-600" : 
                    item.method === "DELETE" ? "text-red-600" : "text-orange-600"
                }`}>{item.method}</span>
                <span className={`font-mono ${getStatusColor(item.statusCode)}`}>{item.statusCode}</span>
             </div>
             <div className="truncate opacity-80 text-[11px]" title={item.url}>{item.url}</div>
             <div className="text-[10px] opacity-40 text-right">
                {new Date(item.timestamp).toLocaleString()}
             </div>
          </div>
        ))}
        {filteredHistory.length === 0 && !loading && (
            <div className="p-4 text-center text-xs text-muted-foreground italic">No history found</div>
        )}
      </div>
    </div>
  );
}