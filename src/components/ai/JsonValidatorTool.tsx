"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Wand2 } from "lucide-react";
import { validateJson, JsonValidationResult } from "@/lib/aiApi";
import { getErrorMessage } from "@/lib/errors";
import OutputBlock from "./OutputBlock";
import { cn } from "@/lib/utils";

export default function JsonValidatorTool() {
  const [json, setJson] = useState("");
  const [expectedSchema, setExpectedSchema] = useState("");
  const [result, setResult] = useState<JsonValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (!json.trim()) {
      toast.error("Paste some JSON to validate first.");
      return;
    }
    setLoading(true);
    try {
      const res = await validateJson(json, expectedSchema.trim() || undefined);
      setResult(res);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to validate JSON."));
    } finally {
      setLoading(false);
    }
  };

  const fullyValid = result?.syntaxValid && result?.structurallyValid;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="json-input">JSON to validate</Label>
        <Textarea
          id="json-input"
          placeholder='{"id": 1, "email": "ada@example.com"}'
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={8}
          className="font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="json-schema">Expected shape (optional)</Label>
        <Textarea
          id="json-schema"
          placeholder='An example JSON showing the expected fields/types, e.g. {"id": 1, "email": "x@example.com"}'
          value={expectedSchema}
          onChange={(e) => setExpectedSchema(e.target.value)}
          rows={3}
          className="font-mono text-xs"
        />
      </div>

      <Button onClick={handleValidate} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Validate
      </Button>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {fullyValid ? (
              <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-600/40 bg-emerald-500/10">
                <CheckCircle2 className="h-3 w-3" /> Valid
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 text-red-600 border-red-600/40 bg-red-500/10">
                <XCircle className="h-3 w-3" /> {result.syntaxValid ? "Structural issues found" : "Invalid syntax"}
              </Badge>
            )}
          </div>

          {result.issues.length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {result.issues.map((issue, i) => (
                <li key={i} className={cn("rounded-md border px-3 py-2", "border-red-600/20 bg-red-500/5")}>
                  <span className="font-mono text-xs text-muted-foreground">{issue.path}</span>
                  <div>{issue.message}</div>
                </li>
              ))}
            </ul>
          )}

          {result.explanation && (
            <div className="space-y-1.5">
              <Label>Explanation</Label>
              <p className="text-sm text-muted-foreground">{result.explanation}</p>
            </div>
          )}

          {result.suggestedFix && (
            <div className="space-y-1.5">
              <Label>Suggested fix</Label>
              <OutputBlock content={result.suggestedFix} filename="fixed.json" minHeight="150px" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
