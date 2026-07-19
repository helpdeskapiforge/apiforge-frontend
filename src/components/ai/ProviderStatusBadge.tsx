"use client";
import { useEffect, useState } from "react";
import { getAIProviderStatus, AIProviderStatus } from "@/lib/aiApi";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, AlertTriangle } from "lucide-react";

export default function ProviderStatusBadge() {
  const [status, setStatus] = useState<AIProviderStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAIProviderStatus()
      .then((s) => { if (!cancelled) setStatus(s); })
      .catch(() => { if (!cancelled) setStatus(null); });
    return () => { cancelled = true; };
  }, []);

  if (!status) return null;

  const ready = !!status.activeProvider;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={
            ready
              ? "gap-1.5 border-emerald-600/40 bg-emerald-500/10 text-emerald-600"
              : "gap-1.5 border-amber-600/40 bg-amber-500/10 text-amber-600"
          }
        >
          {ready ? <Sparkles className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {ready ? "AI Ready" : "AI Unavailable"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {ready
          ? "AI tools are configured and ready to use."
          : "No AI provider is configured. Ask an administrator to set one up."}
      </TooltipContent>
    </Tooltip>
  );
}
