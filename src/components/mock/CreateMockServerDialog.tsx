"use client";
import { useState } from "react";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Server, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: number;
  onSuccess: () => void;
}

export default function CreateMockServerDialog({ open, onOpenChange, workspaceId, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [pathPrefix, setPathPrefix] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    setLoading(true);
    try {
      await api.post("/mocks/servers/create", { 
          name, 
          // If user leaves prefix empty, backend usually handles generation, but we can also omit or send null
          pathPrefix: pathPrefix || undefined, 
          workspaceId: Number(workspaceId) // Ensure number
      });
      setName("");
      setPathPrefix("");
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      alert("Failed to create server");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-orange-500" /> New Mock Server
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Server Name</Label>
            <Input 
              placeholder="e.g. Payment Service" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Path Prefix (Optional)</Label>
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted p-2 rounded-l border border-r-0">/api/mock/simulator/</span>
                <Input 
                    className="rounded-l-none"
                    placeholder="payment-v1" 
                    value={pathPrefix} 
                    onChange={(e) => setPathPrefix(e.target.value)} 
                />
            </div>
            <p className="text-[10px] text-muted-foreground">
                Base URL segment. If empty, a unique ID will be generated.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !name}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}