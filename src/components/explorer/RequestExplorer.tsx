"use client";
import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import {
    ChevronRight, ChevronDown, Folder, Plus, Loader2, Search, MoreHorizontal, Pencil, Trash2,
    FolderPlus, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

import CreateCollectionDialog from "@/components/collection/CreateCollectionDialog";
import CreateRequestDialog from "@/components/request/CreateRequestDialog";
import RenameCollectionDialog from "@/components/collection/RenameCollectionDialog";
import ImportDialog from "@/components/import/ImportDialog";

interface CollectionNode {
  id: number;
  name: string;
  parentId: number | null;
  requests: any[];
  children: CollectionNode[];
}

function buildTree(collections: any[]): CollectionNode[] {
  const nodeById = new Map<number, CollectionNode>();
  collections.forEach((c) => nodeById.set(c.id, { id: c.id, name: c.name, parentId: c.parentId ?? null, requests: c.requests || [], children: [] }));

  const roots: CollectionNode[] = [];
  nodeById.forEach((node) => {
    if (node.parentId && nodeById.has(node.parentId)) {
      nodeById.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export default function RequestExplorer() {
  const { openRequest, activeEntityId, activeWorkspaceId } = useDashboard();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCols, setExpandedCols] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const [colDialog, setColDialog] = useState(false);
  const [colDialogParentId, setColDialogParentId] = useState<number | null>(null);
  const [reqDialog, setReqDialog] = useState(false);
  const [targetColId, setTargetColId] = useState<number | null>(null);
  const [importDialog, setImportDialog] = useState(false);

  const [renameDialog, setRenameDialog] = useState(false);
  const [collectionToRename, setCollectionToRename] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    if (activeWorkspaceId) loadData();
  }, [activeWorkspaceId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const colRes = await api.get(`/collections/workspace/${activeWorkspaceId}`);
      const colsWithRequests = await Promise.all(colRes.data.map(async (col: any) => {
        try {
          const reqRes = await api.get(`/requests/collection/${col.id}`, { params: { page: 0, size: 200 } });
          return { ...col, requests: reqRes.data.data };
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

  const handleAddRequest = (colId: number) => {
    setTargetColId(colId);
    setReqDialog(true);
  };

  const handleAddSubfolder = (parentId: number) => {
    setColDialogParentId(parentId);
    setColDialog(true);
  };

  const handleRename = (col: { id: number; name: string }) => {
    setCollectionToRename(col);
    setRenameDialog(true);
  };

  const handleDelete = async (col: { id: number; name: string }) => {
    if (!confirm(`Delete "${col.name}"? This will delete every request and subfolder inside it too.`)) return;
    try {
      await api.delete(`/collections/${col.id}`);
      toast.success("Collection deleted.");
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete collection."));
    }
  };

  const getMethodColor = (m: string) => {
    if (m === "GET") return "text-emerald-600";
    if (m === "POST") return "text-blue-600";
    if (m === "DELETE") return "text-red-600";
    return "text-orange-600";
  };

  // Search matches at any depth: a folder shows if its name matches, or if any
  // descendant request/folder matches -- otherwise the tree would hide a match
  // three levels deep just because its great-grandparent's name doesn't match.
  const filteredTree = useMemo(() => {
    const tree = buildTree(collections);
    if (!searchTerm.trim()) return tree;

    const q = searchTerm.toLowerCase();
    const filterNode = (node: CollectionNode): CollectionNode | null => {
      const filteredChildren = node.children.map(filterNode).filter(Boolean) as CollectionNode[];
      const filteredRequests = node.requests.filter((r) => r.name.toLowerCase().includes(q));
      const selfMatches = node.name.toLowerCase().includes(q);
      if (selfMatches || filteredChildren.length > 0 || filteredRequests.length > 0) {
        return { ...node, children: filteredChildren, requests: selfMatches ? node.requests : filteredRequests };
      }
      return null;
    };
    return tree.map(filterNode).filter(Boolean) as CollectionNode[];
  }, [collections, searchTerm]);

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-2 border-b space-y-2 shrink-0">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-muted-foreground uppercase">Collections</span>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setImportDialog(true)} title="Import">
              <Upload className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setColDialogParentId(null); setColDialog(true); }} title="New collection">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-7 pl-7 text-xs bg-background"
            placeholder="Filter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 select-none">
        {loading && <div className="text-center p-4"><Loader2 className="animate-spin h-4 w-4 mx-auto text-muted-foreground" /></div>}

        {filteredTree.map((node) => (
          <CollectionTreeItem
            key={node.id}
            node={node}
            depth={0}
            forceOpen={!!searchTerm}
            expandedCols={expandedCols}
            toggleCol={toggleCol}
            activeEntityId={activeEntityId}
            openRequest={openRequest}
            getMethodColor={getMethodColor}
            onAddRequest={handleAddRequest}
            onAddSubfolder={handleAddSubfolder}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        ))}

        {!loading && filteredTree.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground italic">
            {searchTerm ? "No matches found." : "No collections yet."}
          </div>
        )}
      </div>

      <CreateCollectionDialog
        open={colDialog}
        onOpenChange={setColDialog}
        workspaceId={activeWorkspaceId}
        parentId={colDialogParentId}
        onSuccess={loadData}
      />
      <CreateRequestDialog open={reqDialog} onOpenChange={setReqDialog} workspaceId={activeWorkspaceId} collectionId={targetColId} onSuccess={loadData} />
      <RenameCollectionDialog open={renameDialog} onOpenChange={setRenameDialog} collection={collectionToRename} onSuccess={loadData} />
      <ImportDialog open={importDialog} onOpenChange={setImportDialog} onImported={loadData} />
    </div>
  );
}

interface TreeItemProps {
  node: CollectionNode;
  depth: number;
  forceOpen: boolean;
  expandedCols: Set<number>;
  toggleCol: (id: number) => void;
  activeEntityId: number | string | null;
  openRequest: (id: number, title?: string) => void;
  getMethodColor: (m: string) => string;
  onAddRequest: (colId: number) => void;
  onAddSubfolder: (parentId: number) => void;
  onRename: (col: { id: number; name: string }) => void;
  onDelete: (col: { id: number; name: string }) => void;
}

function CollectionTreeItem({
  node, depth, forceOpen, expandedCols, toggleCol, activeEntityId, openRequest,
  getMethodColor, onAddRequest, onAddSubfolder, onRename, onDelete,
}: TreeItemProps) {
  const isOpen = expandedCols.has(node.id) || forceOpen;

  return (
    <div className="mb-0.5" style={{ marginLeft: depth > 0 ? 10 : 0 }}>
      <div
        className="group flex items-center gap-1.5 p-1.5 hover:bg-muted/80 rounded-md cursor-pointer text-sm font-medium transition-colors"
        onClick={() => toggleCol(node.id)}
      >
        {isOpen ? <ChevronDown className="h-3 w-3 opacity-50 shrink-0" /> : <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />}
        <Folder className={`h-3.5 w-3.5 shrink-0 ${isOpen ? "text-primary" : "text-yellow-500/80"}`} />
        <span className="truncate flex-1">{node.name}</span>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onAddRequest(node.id); }} title="Add Request">
            <Plus className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onAddSubfolder(node.id)}>
                <FolderPlus className="h-3.5 w-3.5 mr-2 opacity-70" /> New subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename(node)}>
                <Pencil className="h-3.5 w-3.5 mr-2 opacity-70" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                onClick={() => onDelete(node)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2 opacity-70" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isOpen && (
        <div className="ml-2.5 pl-2 border-l border-border/40 mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <CollectionTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              forceOpen={forceOpen}
              expandedCols={expandedCols}
              toggleCol={toggleCol}
              activeEntityId={activeEntityId}
              openRequest={openRequest}
              getMethodColor={getMethodColor}
              onAddRequest={onAddRequest}
              onAddSubfolder={onAddSubfolder}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
          {node.requests?.map((req: any) => (
            <div
              key={req.id}
              onClick={() => openRequest(req.id, req.name)}
              className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-xs ${activeEntityId === req.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            >
              <span className={`w-8 font-mono font-bold text-[9px] ${getMethodColor(req.method)}`}>{req.method}</span>
              <span className="truncate">{req.name}</span>
            </div>
          ))}
          {node.children.length === 0 && node.requests.length === 0 && (
            <div className="pl-4 text-[10px] text-muted-foreground italic">Empty</div>
          )}
        </div>
      )}
    </div>
  );
}
