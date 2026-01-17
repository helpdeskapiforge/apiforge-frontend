"use client";
import { useState } from "react";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: number;
  onSuccess: () => void;
}

export default function CreateEnvironmentDialog({ open, onOpenChange, workspaceId, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    setLoading(true);
    try {
      // Backend expects DTO: { name, variables, workspaceId }
      await api.post("/environments/create", { 
          name, 
          workspaceId: Number(workspaceId),
          variables: "{}" // Initialize with empty JSON string
      });
      setName("");
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      alert("Failed to create environment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> New Environment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Environment Name</Label>
            <Input 
              placeholder="e.g. Staging, Production" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !name}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}