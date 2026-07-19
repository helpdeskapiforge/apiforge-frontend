"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Terminal, FlaskConical, Database, ShieldCheck, Regex, FileCode2, Bug } from "lucide-react";
import ProviderStatusBadge from "./ProviderStatusBadge";
import CurlGeneratorTool from "./CurlGeneratorTool";
import PostmanTestGeneratorTool from "./PostmanTestGeneratorTool";
import MockDataGeneratorTool from "./MockDataGeneratorTool";
import JsonValidatorTool from "./JsonValidatorTool";
import RegexGeneratorTool from "./RegexGeneratorTool";
import SqlGeneratorTool from "./SqlGeneratorTool";
import ErrorLogExplainerTool from "./ErrorLogExplainerTool";

const GENERATE_TOOLS = [
  { value: "curl", label: "cURL", icon: Terminal, description: "Turn a plain-English description into a ready-to-run cURL command." },
  { value: "postman", label: "Postman Tests", icon: FlaskConical, description: "Generate assertion scripts for a request/response pair." },
  { value: "mock", label: "Mock Data", icon: Database, description: "Produce realistic sample JSON from a shape or schema." },
  { value: "sql", label: "SQL", icon: FileCode2, description: "Describe a query in plain English, get back dialect-correct SQL." },
  { value: "regex", label: "Regex", icon: Regex, description: "Describe a pattern in plain English, get a tested regex." },
] as const;

const ANALYZE_TOOLS = [
  { value: "json", label: "JSON Validator", icon: ShieldCheck, description: "Check JSON for syntax and structural issues, with suggested fixes." },
  { value: "error", label: "Error Log", icon: Bug, description: "Explain a stack trace or error log in plain English." },
] as const;

const ALL_TOOLS = [...GENERATE_TOOLS, ...ANALYZE_TOOLS];

export default function AIToolsPanel() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none">AI Tools</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Developer utilities for everyday API work — generate, validate, and debug.
              </p>
            </div>
          </div>
          <ProviderStatusBadge />
        </div>

        <Tabs defaultValue="curl">
          <div className="space-y-2.5">
            <div className="space-y-1.5">
              <p className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Generate
              </p>
              <TabsList className="h-auto flex-wrap justify-start gap-1.5 bg-transparent p-0">
                {GENERATE_TOOLS.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 shadow-none data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="space-y-1.5">
              <p className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Analyze &amp; debug
              </p>
              <TabsList className="h-auto flex-wrap justify-start gap-1.5 bg-transparent p-0">
                {ANALYZE_TOOLS.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 shadow-none data-[state=active]:border-primary/40 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {ALL_TOOLS.map((t) => (
            <TabsContent key={t.value} value={t.value} className="pt-5 space-y-3">
              <p className="text-sm text-muted-foreground">{t.description}</p>
              {t.value === "curl" && <CurlGeneratorTool />}
              {t.value === "postman" && <PostmanTestGeneratorTool />}
              {t.value === "mock" && <MockDataGeneratorTool />}
              {t.value === "json" && <JsonValidatorTool />}
              {t.value === "regex" && <RegexGeneratorTool />}
              {t.value === "sql" && <SqlGeneratorTool />}
              {t.value === "error" && <ErrorLogExplainerTool />}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
