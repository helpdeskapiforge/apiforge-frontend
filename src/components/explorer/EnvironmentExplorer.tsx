"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { Globe, Plus, Lock, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreateEnvironmentDialog from "@/components/env/CreateEnvironmentDialog"; 

export default function EnvironmentExplorer() {
  const { openEnvironment, activeEntityId, activeWorkspaceId } = useDashboard();
  const [envs, setEnvs] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Reload data when workspace changes OR when an environment update event occurs
  useEffect(() => {
    if(activeWorkspaceId) loadData();

    // Listen for updates from the Editor (e.g. name changes)
    const handleRefresh = () => loadData();
    window.addEventListener("env-change", handleRefresh);
    return () => window.removeEventListener("env-change", handleRefresh);
  }, [activeWorkspaceId]);

  const loadData = async () => {
    if(!activeWorkspaceId) return;
    setLoading(true);
    try {
      // Backend: GET /api/environments/workspace/{id}
      const res = await api.get(`/environments/workspace/${activeWorkspaceId}`);
      setEnvs(res.data);
    } catch (e) { 
        console.error("Failed to load environments", e); 
    } finally {
        setLoading(false);
    }
  };

  const filteredEnvs = envs.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-2 border-b space-y-2 shrink-0 bg-muted/5">
        <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Environments</span>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadData} disabled={loading}>
                    <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
        </div>
        <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
                className="h-8 pl-8 text-xs bg-background" 
                placeholder="Filter environments..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredEnvs.map(env => (
            <div 
                key={env.id}
                onClick={() => openEnvironment(env.id)}
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer text-sm mb-1 group transition-colors ${
                    activeEntityId === env.id 
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
                    : "text-muted-foreground hover:bg-muted border-l-2 border-transparent"
                }`}
            >
                {env.isPrivate ? <Lock className="h-3.5 w-3.5 opacity-50" /> : <Globe className="h-3.5 w-3.5 opacity-50" />}
                <span className="flex-1 truncate">{env.name}</span>
            </div>
        ))}
        {filteredEnvs.length === 0 && !loading && (
            <div className="p-4 text-center text-xs text-muted-foreground italic">No environments found</div>
        )}
      </div>
      
      <CreateEnvironmentDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        workspaceId={activeWorkspaceId} 
        onSuccess={loadData} 
      />
    </div>
  );
}