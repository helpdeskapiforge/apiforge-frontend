"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { FileText, RefreshCw, Server, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface MockLog {
  id: number;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  // Add other fields your model has
}

export default function LogExplorer() {
  const { setActiveEditor, setActiveEntityId, activeEntityId, activeWorkspaceId } = useDashboard();
  
  // State
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [logs, setLogs] = useState<MockLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Load Servers on Mount
  useEffect(() => {
    if (activeWorkspaceId) loadServers();
  }, [activeWorkspaceId]);

  // 2. Load Logs when Server Changes
  useEffect(() => {
    if (selectedServerId) {
      loadLogs(selectedServerId);
      // Persist ID so the Viewer knows which server to query
      localStorage.setItem("currentLogServerId", selectedServerId);
    } else {
      setLogs([]);
    }
  }, [selectedServerId]);

  const loadServers = async () => {
    try {
      const res = await api.get(`/mocks/servers/workspace/${activeWorkspaceId}`);
      setServers(res.data);
      // Auto-select first server if available and nothing selected
      if (res.data.length > 0 && !selectedServerId) {
        setSelectedServerId(res.data[0].id.toString());
      }
    } catch (e) { console.error(e); }
  };

  const loadLogs = async (serverId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/logs/server/${serverId}`);
      setLogs(res.data);
    } catch (e) {
      console.error("Failed to load logs", e);
    } finally {
      setLoading(false);
    }
  };

  const openLog = (id: number) => {
    setActiveEditor("log-viewer");
    setActiveEntityId(id);
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return "text-green-500";
    if (code >= 400 && code < 500) return "text-orange-500";
    return "text-red-500";
  };

  const filteredLogs = logs.filter(log => 
    log.path?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header & Controls */}
      <div className="p-2 border-b space-y-2 shrink-0 bg-muted/5">
        <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Mock Logs</span>
            <Button 
                variant="ghost" size="icon" className="h-6 w-6" 
                onClick={() => selectedServerId && loadLogs(selectedServerId)} 
                disabled={loading || !selectedServerId}
            >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
        </div>

        {/* Server Selector */}
        <Select value={selectedServerId} onValueChange={setSelectedServerId}>
            <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue placeholder="Select Server" />
            </SelectTrigger>
            <SelectContent>
                {servers.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                        <div className="flex items-center gap-2">
                            <Server className="h-3 w-3 text-orange-500"/> {s.name}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
                className="h-8 pl-8 text-xs bg-background" 
                placeholder="Filter logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!selectedServerId}
            />
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 overflow-y-auto p-2">
        {!selectedServerId && (
            <div className="p-8 text-center text-xs text-muted-foreground opacity-60 flex flex-col items-center gap-2">
                <Server className="h-8 w-8 stroke-1" />
                Select a server to view logs
            </div>
        )}

        {selectedServerId && filteredLogs.map((log) => (
          <div
            key={log.id}
            onClick={() => openLog(log.id)}
            className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer text-xs mb-1 transition-colors ${
              activeEntityId === log.id
                ? "bg-primary/10 border-l-2 border-primary"
                : "text-muted-foreground hover:bg-muted border-l-2 border-transparent"
            }`}
          >
             <div className={`font-mono font-bold w-10 shrink-0 ${
                log.method === "GET" ? "text-green-600" : 
                log.method === "POST" ? "text-blue-600" : "text-orange-600"
             }`}>
                {log.method}
             </div>
             
             <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-foreground">{log.path}</div>
                <div className="flex items-center gap-2 text-[10px] opacity-70">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={`font-bold ${getStatusColor(log.statusCode)}`}>
                        {log.statusCode}
                    </span>
                </div>
             </div>
          </div>
        ))}
        
        {selectedServerId && filteredLogs.length === 0 && !loading && (
             <div className="p-4 text-center text-xs text-muted-foreground italic">No logs found.</div>
        )}
      </div>
    </div>
  );
}