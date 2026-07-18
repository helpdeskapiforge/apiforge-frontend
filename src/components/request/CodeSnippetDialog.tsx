"use client";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { SNIPPET_LANGUAGES, SnippetRequest } from "@/lib/codegen";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: SnippetRequest;
}

export default function CodeSnippetDialog({ open, onOpenChange, request }: Props) {
  const [activeLang, setActiveLang] = useState<string>(SNIPPET_LANGUAGES[0].id);
  const [copied, setCopied] = useState(false);

  const activeGenerator = SNIPPET_LANGUAGES.find((l) => l.id === activeLang) ?? SNIPPET_LANGUAGES[0];
  const snippet = useMemo(() => {
    try {
      return activeGenerator.generate(request);
    } catch {
      return "// Failed to generate snippet for this request.";
    }
  }, [activeGenerator, request]);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Code</DialogTitle>
        </DialogHeader>
        <div className="flex gap-1 border-b pb-2 flex-wrap">
          {SNIPPET_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-md",
                activeLang === lang.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 z-10"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <pre className="p-4 rounded-md border bg-muted/40 font-mono text-xs overflow-auto max-h-[400px] whitespace-pre-wrap">
            {snippet}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
