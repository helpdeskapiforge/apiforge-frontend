"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, FileCode2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseCurl } from "@/lib/import/parseCurl";
import { parseOpenApi, ParsedOpenApiResult } from "@/lib/import/parseOpenApi";
import api from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

type Format = "curl" | "openapi";
type Step = "source" | "preview";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}

interface PreviewRequest {
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export default function ImportDialog({ open, onOpenChange, onImported }: Props) {
  const { activeWorkspaceId } = useDashboard();
  const [format, setFormat] = useState<Format>("curl");
  const [step, setStep] = useState<Step>("source");
  const [raw, setRaw] = useState("");
  const [collectionName, setCollectionName] = useState("Imported");
  const [preview, setPreview] = useState<PreviewRequest[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  const reset = () => {
    setStep("source");
    setRaw("");
    setPreview([]);
    setParseError(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handlePreview = () => {
    setParseError(null);
    try {
      if (format === "curl") {
        const parsed = parseCurl(raw);
        setPreview([parsed]);
        setCollectionName(parsed.name);
      } else {
        const parsed: ParsedOpenApiResult = parseOpenApi(raw);
        setCollectionName(parsed.title);
        setPreview(parsed.requests.map((r) => ({
          name: r.name,
          method: r.method,
          url: `${parsed.baseUrl}${r.path}`,
          headers: r.headers,
          body: r.body,
        })));
      }
      setStep("preview");
    } catch (e: any) {
      setParseError(e.message || "Failed to parse this input.");
    }
  };

  const handleCommit = async () => {
    if (!activeWorkspaceId) {
      toast.error("Select a workspace first.");
      return;
    }
    setCommitting(true);
    try {
      const colRes = await api.post("/collections/create", {
        name: collectionName || "Imported",
        workspaceId: activeWorkspaceId,
      });
      const collectionId = colRes.data.id;

      let successCount = 0;
      for (const req of preview) {
        try {
          await api.post("/requests/create", {
            name: req.name,
            method: req.method,
            url: req.url,
            headers: JSON.stringify(req.headers),
            body: req.body || "",
            workspaceId: activeWorkspaceId,
            collectionId,
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to import request "${req.name}"`, e);
        }
      }

      if (successCount === preview.length) {
        toast.success(`Imported ${successCount} request${successCount === 1 ? "" : "s"} into "${collectionName}".`);
      } else {
        toast.error(`Imported ${successCount} of ${preview.length} requests — some failed. Check the console for details.`);
      }
      onImported();
      handleClose(false);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to create the collection for this import."));
    } finally {
      setCommitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import</DialogTitle>
        </DialogHeader>

        {step === "source" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFormat("curl")}
                className={cn("flex-1 border rounded-md p-3 text-sm text-left", format === "curl" && "border-primary bg-primary/5")}
              >
                <div className="font-medium">cURL</div>
                <div className="text-xs text-muted-foreground">Paste a single cURL command</div>
              </button>
              <button
                onClick={() => setFormat("openapi")}
                className={cn("flex-1 border rounded-md p-3 text-sm text-left", format === "openapi" && "border-primary bg-primary/5")}
              >
                <div className="font-medium">OpenAPI (JSON)</div>
                <div className="text-xs text-muted-foreground">Paste an OpenAPI 3.x document</div>
              </button>
            </div>

            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={format === "curl" ? "curl https://api.example.com/users -H 'Accept: application/json'" : "Paste your OpenAPI JSON document here…"}
              className="font-mono text-xs min-h-[220px]"
            />
            {parseError && <p className="text-xs text-red-600">{parseError}</p>}

            <p className="text-xs text-muted-foreground">
              Postman and Insomnia collection import aren&apos;t available yet — planned as a follow-up.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={handlePreview} disabled={!raw.trim()}>Preview</Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <button onClick={() => setStep("source")} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back
            </button>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Collection name</label>
              <Input value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />
            </div>

            <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
              {preview.map((req, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs">
                  <FileCode2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono font-bold w-14 shrink-0">{req.method}</span>
                  <span className="truncate flex-1">{req.name}</span>
                  <span className="text-muted-foreground truncate max-w-[200px]">{req.url}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              This will create a new collection <strong>&ldquo;{collectionName}&rdquo;</strong> with {preview.length} request{preview.length === 1 ? "" : "s"} — nothing is written until you confirm.
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button onClick={handleCommit} disabled={committing}>
                {committing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Import ${preview.length} request${preview.length === 1 ? "" : "s"}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
