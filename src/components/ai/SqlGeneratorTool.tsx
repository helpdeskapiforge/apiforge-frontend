"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2 } from "lucide-react";
import { generateSql, SqlDialect } from "@/lib/aiApi";
import { getErrorMessage } from "@/lib/errors";
import OutputBlock from "./OutputBlock";

const DIALECTS: SqlDialect[] = ["PostgreSQL", "MySQL", "SQLite"];

export default function SqlGeneratorTool() {
  const [description, setDescription] = useState("");
  const [dialect, setDialect] = useState<SqlDialect>("PostgreSQL");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Describe the query you need first.");
      return;
    }
    setLoading(true);
    try {
      const res = await generateSql(description.trim(), dialect);
      setResult(res.result);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to generate SQL."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
        <div className="space-y-2">
          <Label htmlFor="sql-description">Describe the query</Label>
          <Textarea
            id="sql-description"
            placeholder='e.g. "Find the 10 most recent orders for a given customer email, newest first"'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Dialect</Label>
          <Select value={dialect} onValueChange={(v) => setDialect(v as SqlDialect)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DIALECTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        Generate SQL
      </Button>

      <OutputBlock content={result} filename="query.sql" emptyLabel="Your generated SQL will appear here." minHeight="180px" />
    </div>
  );
}
