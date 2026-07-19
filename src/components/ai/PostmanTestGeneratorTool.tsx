"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2 } from "lucide-react";
import { generatePostmanTests } from "@/lib/aiApi";
import { getErrorMessage } from "@/lib/errors";
import OutputBlock from "./OutputBlock";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function PostmanTestGeneratorTool() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [statusCode, setStatusCode] = useState("200");
  const [responseBody, setResponseBody] = useState("");
  const [result, setResult] = useState("");
  const [aiUsed, setAiUsed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!url.trim() || !responseBody.trim()) {
      toast.error("A URL and an actual response body are required to generate real assertions.");
      return;
    }
    setLoading(true);
    try {
      const res = await generatePostmanTests(method, url.trim(), statusCode ? Number(statusCode) : undefined, responseBody);
      setResult(res.combinedScript);
      setAiUsed(!!res.aiSuggestedAssertions);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to generate Postman tests."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_100px] gap-3">
        <div className="space-y-2">
          <Label>Method</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pm-url">Request URL</Label>
          <Input id="pm-url" placeholder="https://api.myapp.com/users/42" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pm-status">Status</Label>
          <Input id="pm-status" type="number" value={statusCode} onChange={(e) => setStatusCode(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pm-body">Actual response body</Label>
        <Textarea
          id="pm-body"
          placeholder='{"id": 42, "email": "ada@example.com", "createdAt": "2024-01-01T00:00:00Z"}'
          value={responseBody}
          onChange={(e) => setResponseBody(e.target.value)}
          rows={8}
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Status/content-type/field-type checks are generated deterministically from this response. An AI
          provider (if configured) only adds extra business-rule assertions and variable extraction on top.
        </p>
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Generate pm.test() script
      </Button>

      {aiUsed === false && result && (
        <p className="text-xs text-muted-foreground">
          No AI provider was available, so this includes deterministic assertions only.
        </p>
      )}

      <OutputBlock content={result} filename="postman-tests.js" emptyLabel="Your generated test script will appear here." minHeight="200px" />
    </div>
  );
}
