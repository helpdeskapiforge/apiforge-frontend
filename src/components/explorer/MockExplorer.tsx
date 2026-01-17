"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { 
    ChevronRight, ChevronDown, Server, Plus, Settings, MoreVertical, Copy, Trash2, Clock, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import CreateMockServerDialog from "@/components/mock/CreateMockServerDialog";

// Helper for cleaner logic in render
const getMethodColor = (m: string) => {
    switch(m) {
        case "GET": return "text-emerald-600 dark:text-emerald-500";
        case "POST": return "text-blue-600 dark:text-blue-500";
        case "PUT": return "text-orange-600 dark:text-orange-500";
        case "DELETE": return "text-red-600 dark:text-red-500";
        default: return "text-foreground";
    }
};

export default function MockExplorer() {
  const { openMockRoute, openMockServer, activeEntityId, activeWorkspaceId } = useDashboard();
  const [servers, setServers] = useState<any[]>([]);
  const [expandedServers, setExpandedServers] = useState<Set<number>>(new Set());
  const [serverRoutes, setServerRoutes] = useState<Record<number, any[]>>({}); 
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if(activeWorkspaceId) loadData();
  }, [activeWorkspaceId]);

  const loadData = async () => {
    try {
      const res = await api.get(`/mocks/servers/workspace/${activeWorkspaceId}`);
      setServers(res.data);
    } catch(e) { console.error(e); }
  };

  const toggleServer = async (e: React.MouseEvent, serverId: number) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(serverId)) {
        newExpanded.delete(serverId);
    } else {
        newExpanded.add(serverId);
        if (!serverRoutes[serverId]) {
            await loadRoutesForServer(serverId);
        }
    }
    setExpandedServers(newExpanded);
  };

  const loadRoutesForServer = async (serverId: number) => {
    try {
        const res = await api.get(`/mocks/routes/server/${serverId}`);
        const sorted = res.data.sort((a: any, b: any) => b.id - a.id);
        setServerRoutes(prev => ({ ...prev, [serverId]: sorted }));
    } catch (e) { console.error(e); }
  };
  
  const handleCreateRoute = async (e: React.MouseEvent, serverId: number) => {
    e.stopPropagation();
    try {
        const res = await api.post("/mocks/routes/create", {
            method: "GET", path: "/new-route", statusCode: 200, responseBody: "{}", isEnabled: true, mockServerId: serverId,
            delayMs: 0, chaosEnabled: false, failureRate: 0.0
        });
        await loadRoutesForServer(serverId);
        openMockRoute(res.data.id);
    } catch(e) { alert("Failed to create route"); }
  };

  const toggleRouteEnabled = async (e: React.MouseEvent, route: any, serverId: number) => {
    e.stopPropagation(); 
    const newStatus = !route.isEnabled;
    setServerRoutes(prev => ({
        ...prev,
        [serverId]: prev[serverId].map(r => r.id === route.id ? { ...r, isEnabled: newStatus } : r)
    }));
    try {
        await api.put(`/mocks/routes/${route.id}`, { 
            mockServerId: serverId, isEnabled: newStatus 
        });
    } catch(e) { loadRoutesForServer(serverId); }
  };

  const handleDuplicateRoute = async (e: React.MouseEvent, route: any, serverId: number) => {
    e.stopPropagation();
    const { id, ...rest } = route; 
    await api.post("/mocks/routes/create", { 
        ...rest, path: `${rest.path}-copy`, mockServerId: serverId 
    });
    loadRoutesForServer(serverId);
  };

  const handleDeleteRoute = async (e: React.MouseEvent, routeId: number, serverId: number) => {
    e.stopPropagation();
    if(!confirm("Delete this route?")) return;
    await api.delete(`/mocks/routes/${routeId}`);
    loadRoutesForServer(serverId);
  };

  return (
    <div className="flex flex-col h-full relative bg-muted/5">
      <div className="p-3 border-b flex items-center justify-between shrink-0 bg-background/50 backdrop-blur">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">Mock Servers</span>
        <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-muted" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {servers.map(server => (
          <div key={server.id} className="select-none">
            {/* Server Row */}
            <div 
                className={`
                    group flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer text-sm font-medium transition-all duration-150 ease-out
                    ${activeEntityId === server.id && !serverRoutes[server.id]?.some((r: any) => r.id === activeEntityId)
                        ? "bg-muted text-foreground shadow-sm ring-1 ring-border" 
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }
                `}
                onClick={() => openMockServer(server.id)}
            >
                <div 
                    className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    onClick={(e) => toggleServer(e, server.id)}
                >
                    {expandedServers.has(server.id) 
                        ? <ChevronDown className="h-3.5 w-3.5 opacity-70" /> 
                        : <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                    }
                </div>
                
                <Server className="h-3.5 w-3.5 text-orange-500/80" />
                <span className="truncate flex-1 font-semibold">{server.name}</span>
                
                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity duration-200">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={(e) => handleCreateRoute(e, server.id)} title="Add Route">
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            
            {/* Routes List */}
            {expandedServers.has(server.id) && (
                <div className="ml-[11px] pl-2 border-l border-border/40 mt-1 space-y-[1px]">
                    {serverRoutes[server.id]?.map((route: any) => {
                        const isActive = activeEntityId === route.id;
                        return (
                            <div 
                                key={route.id}
                                onClick={() => openMockRoute(route.id)}
                                className={`
                                    group flex items-center gap-2 p-1.5 pl-3 rounded-r-md cursor-pointer text-xs border-l-[3px] transition-all duration-150
                                    ${isActive 
                                        ? "bg-primary/5 border-primary text-foreground font-medium" 
                                        : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                    } 
                                    ${!route.isEnabled ? "opacity-60 grayscale" : ""}
                                `}
                            >
                                <span className={`w-9 font-mono font-bold text-[10px] ${getMethodColor(route.method)}`}>
                                    {route.method}
                                </span>
                                
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <span className="truncate">{route.path}</span>
                                    {(route.delayMs > 0 || route.chaosEnabled) && (
                                        <div className="flex gap-0.5 opacity-70">
                                            {route.delayMs > 0 && <Clock className="h-2.5 w-2.5 text-blue-500"/>}
                                            {route.chaosEnabled && <AlertTriangle className="h-2.5 w-2.5 text-red-500"/>}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                    <div onClick={(e) => toggleRouteEnabled(e, route, server.id)} title="Toggle Route">
                                        <Switch checked={!!route.isEnabled} className="scale-[0.6] h-4 w-7 data-[state=checked]:bg-green-600" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <div className="h-4 w-4 flex items-center justify-center hover:bg-muted rounded" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="h-3 w-3" />
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-32">
                                            <DropdownMenuItem onClick={(e) => handleDuplicateRoute(e, route, server.id)}>
                                                <Copy className="h-3 w-3 mr-2" /> Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={(e) => handleDeleteRoute(e, route.id, server.id)}>
                                                <Trash2 className="h-3 w-3 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })}
                    {!serverRoutes[server.id]?.length && (
                        <div className="pl-2 py-2 text-[10px] text-muted-foreground italic flex flex-col items-start gap-1">
                            <span>No routes yet.</span>
                            <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={(e) => handleCreateRoute(e, server.id)}>
                                Create First Route
                            </Button>
                        </div>
                    )}
                </div>
            )}
          </div>
        ))}
      </div>
      
      <CreateMockServerDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        workspaceId={activeWorkspaceId} 
        onSuccess={loadData} 
      />
    </div>
  );
}