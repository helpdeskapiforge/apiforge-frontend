"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, RefreshCw, Trash2, Globe, AlertCircle, Check } from "lucide-react";
import KeyValueTable from "@/components/request/KeyValueTable"; 
import { useDashboard } from "@/context/DashboardContext";

export default function EnvEditor({ envId }: { envId: number }) {
  const { setActiveEditor, setActiveEntityId, activeWorkspaceId } = useDashboard();
  const [env, setEnv] = useState<any>(null);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Feedback States
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if(envId && activeWorkspaceId) loadData();
  }, [envId, activeWorkspaceId]);

  const loadData = async () => {
    setLoading(true);
    try {
        // Backend workaround: Fetch ALL list for workspace, then find match
        const res = await api.get(`/environments/workspace/${activeWorkspaceId}`);
        const found = res.data.find((e: any) => e.id === envId);
        
        if (found) {
            setEnv(found);
            setVars(found.variables ? JSON.parse(found.variables) : {});
        } else {
            setEnv(null);
        }
    } catch(e) {
        console.error("Failed to load env", e);
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
    if(!env) return;
    setSaving(true);
    try {
      // 1. Update Backend
      await api.put(`/environments/${envId}`, {
        name: env.name,
        variables: JSON.stringify(vars)
      });
      
      // 2. CHECK: Is this the active environment? Update local cache immediately
      const activeEnvId = localStorage.getItem("activeEnvId");
      if (activeEnvId && activeEnvId === envId.toString()) {
          localStorage.setItem("activeEnvVars", JSON.stringify(vars));
      }

      // 3. Notify Listeners
      window.dispatchEvent(new Event("env-change"));
      
      // ✅ Success Feedback
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      
    } catch(e) { 
        alert("Failed to save environment"); 
    } finally { 
        setSaving(false); 
    }
  };

  const handleDelete = async () => {
    if(!confirm(`Delete environment "${env.name}"?`)) return;
    try {
        await api.delete(`/environments/${envId}`);
        setActiveEditor("empty");
        setActiveEntityId(null);
        window.dispatchEvent(new Event("env-change"));
    } catch(e) { alert("Failed to delete"); }
  };

  if(loading) return <div className="h-full flex items-center justify-center text-muted-foreground gap-2"><RefreshCw className="h-4 w-4 animate-spin"/> Loading...</div>;
  
  if(!env) return <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2"><AlertCircle className="h-6 w-6"/><span>Environment not found.</span></div>;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-6 bg-muted/5">
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Globe className="h-4 w-4" />
            </div>
            <Input 
                value={env.name} 
                onChange={(e) => setEnv({...env, name: e.target.value})}
                className="h-8 w-64 font-bold bg-transparent border-transparent hover:border-input focus:border-primary px-2 transition-all"
            />
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-red-500">
                <Trash2 className="h-4 w-4" />
            </Button>
            <div className="w-[1px] h-4 bg-border mx-1" />
            
            {/* SAVE BUTTON WITH FEEDBACK */}
            <Button 
                onClick={handleSave} 
                disabled={saving} 
                size="sm" 
                variant={isSaved ? "outline" : "default"}
                className={`gap-2 min-w-[100px] transition-all duration-300 ${isSaved ? "bg-green-50 text-green-600 border-green-200 hover:text-green-700 hover:bg-green-50" : ""}`}
            >
                {saving ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : isSaved ? (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                        <Check className="h-3.5 w-3.5" />
                        <span className="font-bold">Saved</span>
                    </div>
                ) : (
                    <>
                        <Save className="h-3.5 w-3.5" />
                        Save
                    </>
                )}
            </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl space-y-6 mx-auto">
            
            {/* Info Box */}
            <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg text-sm text-muted-foreground flex items-start gap-3">
                <div className="mt-0.5 text-blue-500">ℹ️</div>
                <div>
                    <p className="font-medium text-foreground mb-1">Variable Reference</p>
                    <p>Reference these variables in any request using <code className="text-primary font-mono bg-background px-1 border rounded">{"{{variable_name}}"}</code>.</p>
                </div>
            </div>
            
            {/* Variables Table */}
            <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Variables</h3>
                <div className="border rounded-md overflow-hidden shadow-sm">
                    <KeyValueTable initialData={vars} onChange={setVars} />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}