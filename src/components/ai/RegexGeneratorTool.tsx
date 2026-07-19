"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2 } from "lucide-react";
import { generateRegex } from "@/lib/aiApi";
import { getErrorMessage } from "@/lib/errors";
import OutputBlock from "./OutputBlock";

export default function RegexGeneratorTool() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Describe what the pattern should match first.");
      return;
    }
    setLoading(true);
    try {
      const res = await generateRegex(description.trim());
      setResult(res.result);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to generate regex."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="regex-description">What should the pattern match?</Label>
        <Textarea
          id="regex-description"
          placeholder='e.g. "a US phone number, optionally with a country code" or "a slug: lowercase letters, numbers, and hyphens only"'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Generate regex
      </Button>

      <OutputBlock content={result} filename="pattern.txt" emptyLabel="Your generated pattern + explanation will appear here." minHeight="180px" />
    </div>
  );
}
