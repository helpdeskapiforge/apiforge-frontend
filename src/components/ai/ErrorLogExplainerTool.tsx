"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2 } from "lucide-react";
import { explainError } from "@/lib/aiApi";
import { getErrorMessage } from "@/lib/errors";
import OutputBlock from "./OutputBlock";

export default function ErrorLogExplainerTool() {
  const [logText, setLogText] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    if (!logText.trim()) {
      toast.error("Paste an error or log excerpt first.");
      return;
    }
    setLoading(true);
    try {
      const res = await explainError(logText.trim(), context.trim() || undefined);
      setResult(res.result);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to explain the error."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="error-log">Error / stack trace / log excerpt</Label>
        <Textarea
          id="error-log"
          placeholder="Paste a Java/Spring, Node, Docker, Kubernetes, Postgres, Redis, or NGINX error here..."
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          rows={10}
          className="font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="error-context">Additional context (optional)</Label>
        <Input
          id="error-context"
          placeholder='e.g. "happens only on startup" or "started after upgrading Postgres"'
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
      </div>

      <Button onClick={handleExplain} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Explain this error
      </Button>

      <OutputBlock content={result} filename="explanation.txt" emptyLabel="The cause, fix, and an example will appear here." minHeight="220px" />
    </div>
  );
}
