"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2 } from "lucide-react";
import { generateCurl } from "@/lib/aiApi";
import { getErrorMessage } from "@/lib/errors";
import OutputBlock from "./OutputBlock";

export default function CurlGeneratorTool() {
  const [description, setDescription] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authHint, setAuthHint] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Describe what the request should do first.");
      return;
    }
    setLoading(true);
    try {
      const res = await generateCurl(description.trim(), baseUrl.trim() || undefined, authHint.trim() || undefined);
      setResult(res.result);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to generate curl command."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="curl-description">What should the request do?</Label>
        <Textarea
          id="curl-description"
          placeholder='e.g. "Create a new user with an email and password" or "Get all orders for customer 42"'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="curl-base-url">Base URL (optional)</Label>
          <Input id="curl-base-url" placeholder="https://api.myapp.com" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="curl-auth">Auth hint (optional)</Label>
          <Input id="curl-auth" placeholder="Bearer token / API key" value={authHint} onChange={(e) => setAuthHint(e.target.value)} />
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Generate curl command
      </Button>

      <OutputBlock content={result} filename="request.sh" emptyLabel="Your generated curl command will appear here." />
    </div>
  );
}
