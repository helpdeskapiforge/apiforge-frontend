"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { 
    ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Loader2, Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Reuse your existing dialogs!
import CreateCollectionDialog from "@/components/collection/CreateCollectionDialog"; // Check path
import CreateRequestDialog from "@/components/request/CreateRequestDialog"; // Check path

export default function RequestExplorer() {
  const { openRequest, activeEntityId, activeWorkspaceId } = useDashboard();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCols, setExpandedCols] = useState<Set<number>>(new Set());
  
  const [colDialog, setColDialog] = useState(false);
  const [reqDialog, setReqDialog] = useState(false);
  const [targetColId, setTargetColId] = useState<number | null>(null);

  useEffect(() => {
    if(activeWorkspaceId) loadData();
  }, [activeWorkspaceId]);

  const loadData = async () => {
    setLoading(true);
    try {
        const colRes = await api.get(`/collections/workspace/${activeWorkspaceId}`);
        const colsWithRequests = await Promise.all(colRes.data.map(async (col: any) => {
            try {
                const reqRes = await api.get(`/requests/collection/${col.id}`);
                return { ...col, requests: reqRes.data };
            } catch (e) { return { ...col, requests: [] }; }
        }));
        setCollections(colsWithRequests);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const toggleCol = (id: number) => {
    const newSet = new Set(expandedCols);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedCols(newSet);
  };

  const handleAddRequest = (e: React.MouseEvent, colId: number) => {
    e.stopPropagation();
    setTargetColId(colId);
    setReqDialog(true);
  };

  const getMethodColor = (m: string) => {
     if(m==="GET") return "text-emerald-600";
     if(m==="POST") return "text-blue-600";
     if(m==="DELETE") return "text-red-600";
     return "text-orange-600";
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Search Header */}
      <div className="p-2 border-b space-y-2 shrink-0">
        <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Collections</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setColDialog(true)}>
                <Plus className="h-3 w-3" />
            </Button>
        </div>
        <Input className="h-7 text-xs bg-background" placeholder="Filter..." />
      </div>

      {/* Tree List */}
      <div className="flex-1 overflow-y-auto p-2 select-none">
        {loading && <div className="text-center p-4"><Loader2 className="animate-spin h-4 w-4 mx-auto text-muted-foreground"/></div>}
        
        {collections.map(col => {
            const isOpen = expandedCols.has(col.id);
            return (
                <div key={col.id} className="mb-1">
                    <div 
                        className="group flex items-center gap-1.5 p-1.5 hover:bg-muted/80 rounded-md cursor-pointer text-sm font-medium transition-colors"
                        onClick={() => toggleCol(col.id)}
                    >
                        {isOpen ? <ChevronDown className="h-3 w-3 opacity-50"/> : <ChevronRight className="h-3 w-3 opacity-50"/>}
                        <Folder className={`h-3.5 w-3.5 ${isOpen ? 'text-primary' : 'text-yellow-500/80'}`} />
                        <span className="truncate flex-1">{col.name}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={(e) => handleAddRequest(e, col.id)}>
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    {isOpen && (
                        <div className="ml-2.5 pl-2 border-l border-border/40 mt-0.5 space-y-0.5">
                            {col.requests?.map((req: any) => (
                                <div 
                                    key={req.id}
                                    onClick={() => openRequest(req.id)}
                                    className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-xs ${activeEntityId === req.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                                >
                                    <span className={`w-8 font-mono font-bold text-[9px] ${getMethodColor(req.method)}`}>{req.method}</span>
                                    <span className="truncate">{req.name}</span>
                                </div>
                            ))}
                            {col.requests.length === 0 && <div className="pl-4 text-[10px] text-muted-foreground italic">No requests</div>}
                        </div>
                    )}
                </div>
            )
        })}
      </div>

      {/* Reusing Your Existing Dialogs */}
      <CreateCollectionDialog open={colDialog} onOpenChange={setColDialog} workspaceId={activeWorkspaceId} onSuccess={loadData} />
      <CreateRequestDialog open={reqDialog} onOpenChange={setReqDialog} workspaceId={activeWorkspaceId} collectionId={targetColId} onSuccess={loadData} />
    </div>
  );
}