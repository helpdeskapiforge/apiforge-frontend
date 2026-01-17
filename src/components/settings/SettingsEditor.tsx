"use client";
import { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Moon, Sun, Laptop, Download, Key, RefreshCw, Globe, CheckCircle2, Copy 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes"; // 1. Import next-themes hook

export default function SettingsEditor({ category }: { category: string }) {
  const { activeWorkspaceId } = useDashboard();
  const { theme, setTheme } = useTheme(); // 2. Use the hook for global state
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Data States
  const [workspace, setWorkspace] = useState<any>(null);
  
  // User Data State
  const [user, setUser] = useState({ fullName: "", email: "", initials: "" });
  const [fullNameInput, setFullNameInput] = useState("");
  
  // Local Preference States (For non-theme settings)
  const [requestTimeout, setRequestTimeout] = useState("0");
  const [followRedirects, setFollowRedirects] = useState(true);
  const [sslVerify, setSslVerify] = useState(true);
  const [proxyConfig, setProxyConfig] = useState({ host: "", port: "", auth: false });

  // 1️⃣ Load Data on Mount
  useEffect(() => {
    // Note: We don't load 'theme' manually anymore. The hook handles it.
    
    loadLocalPreferences();
    if (activeWorkspaceId) loadWorkspaceData();
    loadUserData();
  }, [activeWorkspaceId, category]);

  const loadLocalPreferences = () => {
    setRequestTimeout(localStorage.getItem("req_timeout") || "0");
    setFollowRedirects(localStorage.getItem("req_redirects") === "true");
    setSslVerify(localStorage.getItem("req_ssl_verify") !== "false"); 
    
    const savedProxy = localStorage.getItem("req_proxy");
    if (savedProxy) setProxyConfig(JSON.parse(savedProxy));
  };

  const loadWorkspaceData = async () => {
    try {
        const res = await api.get("/workspaces/my-workspaces");
        const found = res.data.find((w: any) => w.id === activeWorkspaceId);
        if (found) setWorkspace(found);
    } catch (e) { console.error("Failed to load workspace", e); }
  };

  const loadUserData = () => {
    const stored = localStorage.getItem("user");
    if (stored) {
        try {
            const u = JSON.parse(stored);
            const name = u.fullName || (u.firstName ? `${u.firstName} ${u.lastName}` : "User");
            
            setUser({
                fullName: name,
                email: u.email,
                initials: name.substring(0, 2).toUpperCase()
            });
            setFullNameInput(name);
        } catch (e) {
            console.error("Failed to parse user data", e);
        }
    }
  };

  // 2️⃣ Actions
  const handleSave = async () => {
    setLoading(true);
    setSuccessMsg("");

    try {
        if (category === "workspace" && workspace) {
            await api.put(`/workspaces/${activeWorkspaceId}`, { name: workspace.name });
        } 
        else if (category === "account") {
            await api.put("/user/profile", { fullName: fullNameInput });
            
            const stored = localStorage.getItem("user");
            if (stored) {
                const u = JSON.parse(stored);
                u.fullName = fullNameInput;
                u.firstName = fullNameInput.split(" ")[0]; 
                localStorage.setItem("user", JSON.stringify(u));
            }
            
            setUser(prev => ({ 
                ...prev, 
                fullName: fullNameInput, 
                initials: fullNameInput.substring(0, 2).toUpperCase() 
            }));
            
            window.dispatchEvent(new Event("user-update")); 
        }
        else if (category === "general" || category === "security") {
            // Note: Theme is already saved via setTheme()
            
            // Save other preferences
            localStorage.setItem("req_timeout", requestTimeout);
            localStorage.setItem("req_redirects", String(followRedirects));
            localStorage.setItem("req_ssl_verify", String(sslVerify));
            localStorage.setItem("req_proxy", JSON.stringify(proxyConfig));
            
            window.dispatchEvent(new Event("settings-change"));
        }
        
        setSuccessMsg("Settings saved successfully.");
        setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
        alert("Failed to save settings.");
    } finally {
        setLoading(false);
    }
  };

  const handleExportWorkspace = () => {
    if (!workspace) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workspace, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `workspace-${workspace.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDeleteWorkspace = async () => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
        await api.delete(`/workspaces/${activeWorkspaceId}`);
        alert("Workspace deleted.");
        window.location.reload(); 
    } catch (e) { alert("Failed to delete workspace"); }
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <div className="h-14 border-b flex items-center justify-between px-6 bg-muted/5 shrink-0">
        <div className="flex items-center gap-3">
            <span className="font-bold text-lg capitalize">{category} Settings</span>
            {successMsg && (
                <span className="text-xs text-green-600 flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                    <CheckCircle2 className="h-3 w-3" /> {successMsg}
                </span>
            )}
        </div>
        <Button size="sm" onClick={handleSave} disabled={loading}>
            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-10 pb-20">
            
            {/* ================= GENERAL TAB ================= */}
            {category === "general" && (
                <>
                    <section className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold">Appearance</h3>
                            <p className="text-sm text-muted-foreground">Customize how APIForge looks on your device.</p>
                        </div>
                        <Separator />
                        
                        <div className="grid grid-cols-3 gap-4">
                            {["light", "dark", "system"].map((t) => (
                                <div 
                                    key={t}
                                    // 3. Direct update via hook (Instant & Persistent)
                                    onClick={() => setTheme(t)} 
                                    className={`
                                        cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-all
                                        ${theme === t ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}
                                    `}
                                >
                                    {t === "light" && <Sun className="h-6 w-6" />}
                                    {t === "dark" && <Moon className="h-6 w-6" />}
                                    {t === "system" && <Laptop className="h-6 w-6" />}
                                    <span className="capitalize text-sm font-medium">{t} Mode</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold">Request Defaults</h3>
                            <p className="text-sm text-muted-foreground">Global configurations for all new requests.</p>
                        </div>
                        <Separator />
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Request Timeout</Label>
                                    <p className="text-sm text-muted-foreground">Max time (ms) to wait for a response (0 = infinite).</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input 
                                        className="w-24 text-right" 
                                        value={requestTimeout}
                                        onChange={(e) => setRequestTimeout(e.target.value)}
                                        type="number"
                                    />
                                    <span className="text-sm text-muted-foreground">ms</span>
                                </div>
                            </div>
                            <Separator className="opacity-50" />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Follow Redirects</Label>
                                    <p className="text-sm text-muted-foreground">Automatically follow 3xx HTTP redirects.</p>
                                </div>
                                <Switch checked={followRedirects} onCheckedChange={setFollowRedirects} />
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* ================= WORKSPACE TAB ================= */}
            {category === "workspace" && workspace && (
                <>
                    <section className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold">Workspace Identity</h3>
                            <p className="text-sm text-muted-foreground">Manage your workspace name and identifiers.</p>
                        </div>
                        <Separator />
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Display Name</Label>
                                <Input 
                                    value={workspace.name} 
                                    onChange={(e) => setWorkspace({...workspace, name: e.target.value})}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Workspace ID</Label>
                                <div className="flex gap-2">
                                    <Input value={workspace.id} disabled className="bg-muted font-mono" />
                                    <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(workspace.id.toString())}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold">Data & Storage</h3>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                            <div className="space-y-1">
                                <div className="font-medium flex items-center gap-2">
                                    <Download className="h-4 w-4" /> Export Workspace Data
                                </div>
                                <p className="text-sm text-muted-foreground">Download current workspace configuration as JSON.</p>
                            </div>
                            <Button variant="outline" onClick={handleExportWorkspace}>Export</Button>
                        </div>
                    </section>

                    <section className="space-y-4 pt-4">
                        <div>
                            <h3 className="text-base font-semibold text-red-600">Danger Zone</h3>
                        </div>
                        <div className="border border-red-200 dark:border-red-900/50 rounded-lg overflow-hidden">
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="font-medium text-red-900 dark:text-red-200">Delete Workspace</div>
                                    <p className="text-sm text-red-700/80 dark:text-red-300/70">
                                        Permanently remove this workspace. This cannot be undone.
                                    </p>
                                </div>
                                <Button variant="destructive" onClick={handleDeleteWorkspace}>Delete</Button>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* ================= ACCOUNT TAB ================= */}
            {category === "account" && (
                <>
                    <section className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold">Profile</h3>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-6">
                            <div className="h-20 w-20 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                                {user.initials}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="grid gap-2">
                                    <Label>Full Name</Label>
                                    <Input 
                                        value={fullNameInput} 
                                        onChange={(e) => setFullNameInput(e.target.value)}
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input value={user.email} disabled className="bg-muted text-muted-foreground" />
                                    <p className="text-[11px] text-muted-foreground">Managed by Organization Admin</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold">API Access</h3>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                             <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-1">
                                    <div className="font-medium flex items-center gap-2">
                                        <Key className="h-4 w-4 text-orange-500" /> Personal Access Token
                                    </div>
                                    <p className="text-sm text-muted-foreground">Use this token to authenticate external tools.</p>
                                </div>
                                <Button variant="secondary" onClick={() => alert("Token generation coming in v2.0")}>Generate New Token</Button>
                             </div>
                        </div>
                    </section>
                </>
            )}

            {/* ================= SECURITY TAB ================= */}
            {category === "security" && (
                <>
                    <section className="space-y-4">
                        <div>
                            <h3 className="text-base font-semibold">Certificates & Proxy</h3>
                            <p className="text-sm text-muted-foreground">Manage SSL behavior and network proxies.</p>
                        </div>
                        <Separator />
                        
                        <div className="space-y-6">
                             {/* SSL Toggle */}
                            <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-base">SSL Certificate Verification</Label>
                                        {sslVerify ? <Badge variant="outline" className="text-green-600 bg-green-50">Secure</Badge> : <Badge variant="destructive">Unsafe</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground max-w-md">
                                        Validates server certificates before sending requests. Disable if using self-signed certs.
                                    </p>
                                </div>
                                <Switch checked={sslVerify} onCheckedChange={setSslVerify} />
                            </div>

                            <Separator />

                            {/* Proxy Config */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    <Label className="text-base">System Proxy</Label>
                                </div>
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-8 space-y-2">
                                        <Label className="text-xs">Proxy Host</Label>
                                        <Input 
                                            placeholder="e.g., 127.0.0.1" 
                                            value={proxyConfig.host}
                                            onChange={(e) => setProxyConfig({...proxyConfig, host: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-span-4 space-y-2">
                                        <Label className="text-xs">Port</Label>
                                        <Input 
                                            placeholder="8080" 
                                            value={proxyConfig.port}
                                            onChange={(e) => setProxyConfig({...proxyConfig, port: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch 
                                        id="proxy-auth" 
                                        checked={proxyConfig.auth}
                                        onCheckedChange={(c) => setProxyConfig({...proxyConfig, auth: c})}
                                    />
                                    <Label htmlFor="proxy-auth">Use Proxy Authentication</Label>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}

        </div>
      </div>
    </div>
  );
}