"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  requestData: { method: string; url: string; body: string; headers: Record<string, string>; authConfig: any };
  onSaved: (requestId: number) => void;
}

export default function SaveToCollectionDialog({ open, onOpenChange, requestData, onSaved }: Props) {
  const { activeWorkspaceId } = useDashboard();
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionId, setCollectionId] = useState<string>("");
  const [name, setName] = useState("New Request");
  const [loading, setLoading] = useState(false);
  const [fetchingCollections, setFetchingCollections] = useState(false);

  useEffect(() => {
    if (open && activeWorkspaceId) loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeWorkspaceId]);

  const loadCollections = async () => {
    setFetchingCollections(true);
    try {
      const res = await api.get(`/collections/workspace/${activeWorkspaceId}`);
      setCollections(res.data);
      if (res.data.length > 0) setCollectionId(String(res.data[0].id));
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to load collections."));
    } finally {
      setFetchingCollections(false);
    }
  };

  const handleSave = async () => {
    if (!collectionId) {
      toast.error("Please select (or create) a collection first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/requests/create", {
        name,
        method: requestData.method,
        url: requestData.url,
        body: requestData.body,
        headers: JSON.stringify(requestData.headers),
        authConfig: JSON.stringify(requestData.authConfig),
        workspaceId: activeWorkspaceId,
        collectionId: Number(collectionId),
      });
      onSaved(res.data.id);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save request."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Request name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Get user profile" />
          </div>
          <div className="space-y-2">
            <Label>Collection</Label>
            {fetchingCollections ? (
              <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading collections…</div>
            ) : collections.length === 0 ? (
              <p className="text-xs text-muted-foreground">No collections yet in this workspace — create one first from the sidebar, then try again.</p>
            ) : (
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger><SelectValue placeholder="Choose a collection" /></SelectTrigger>
                <SelectContent>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || !collectionId}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
