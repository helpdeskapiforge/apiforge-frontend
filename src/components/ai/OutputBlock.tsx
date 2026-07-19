"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download } from "lucide-react";

interface Props {
  content: string;
  filename?: string;
  emptyLabel?: string;
  minHeight?: string;
}

export default function OutputBlock({ content, filename = "output.txt", emptyLabel = "Nothing generated yet.", minHeight = "120px" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={handleCopy} disabled={!content} title="Copy">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={handleDownload} disabled={!content} title="Download">
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
      <pre
        className="p-4 rounded-md border bg-muted/40 font-mono text-xs overflow-auto whitespace-pre-wrap break-words"
        style={{ minHeight }}
      >
        {content || emptyLabel}
      </pre>
    </div>
  );
}
