"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes"; 
import { 
    Search, Bell, Moon, Sun, ChevronDown, Eye, LogOut, User, Settings, Check, Plus, 
    Briefcase, Globe, FileCode, Server, ArrowRight, Zap, Folder,
    X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import CreateWorkspaceDialog from "@/components/workspace/CreateWorkspaceDialog"; 
import { useDashboard } from "@/context/DashboardContext"; 

import { deleteCookie } from "cookies-next";

// --- TYPES ---
type SearchItem = {
    id: number | string;
    type: 'request' | 'mock' | 'env' | 'workspace' | 'collection';
    name: string;
    method?: string; 
    label: string;   
    meta?: string;
    icon: any;
};

// --- HELPER: Highlight ---
const Highlight = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim() || !text) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => 
                part.toLowerCase() === highlight.toLowerCase() 
                ? <span key={i} className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-semibold px-0.5 rounded-[2px]">{part}</span> 
                : part
            )}
        </span>
    );
};

export default function TopBar() {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { setActiveModule, setActiveEditor, setActiveEntityId } = useDashboard(); 
  
  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState<SearchItem[]>([]); // The "Master List"
  const searchRef = useRef<HTMLDivElement>(null);

  // --- APP STATE ---
  const [envs, setEnvs] = useState<any[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<string>("none");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null);
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: "Guest", role: "User", initials: "G" });
  const [notifications, setNotifications] = useState([{ id: 1, text: "Welcome to APIForge", time: "Just now" }]);

  // --- INITIALIZATION ---
  useEffect(() => {
    initializeDashboard();
    loadUserProfile();
    
    // Global Event Listeners
    const handleUserUpdate = () => loadUserProfile();
    const handleClickOutside = (event: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setIsSearchOpen(false);
        }
    };

    window.addEventListener("user-update", handleUserUpdate);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        window.removeEventListener("user-update", handleUserUpdate);
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, []);

  // --- 🚀 BUILD SEARCH INDEX (The "Motivation" Logic) ---
  // We fetch data exactly like RequestExplorer does to avoid 404s
  useEffect(() => {
    if (activeWorkspace?.id) {
        buildSearchIndex(activeWorkspace.id);
    }
  }, [activeWorkspace, workspaces, envs]);

  const buildSearchIndex = async (workspaceId: number) => {
    let index: SearchItem[] = [];

    // 1. Add Workspaces (Already loaded)
    workspaces.forEach(w => index.push({
        id: w.id, type: 'workspace', name: w.name, label: 'Workspace', icon: Briefcase
    }));

    // 2. Add Environments (Already loaded)
    envs.forEach(e => index.push({
        id: e.id, type: 'env', name: e.name, label: 'Environment', icon: Globe
    }));

    // 3. Fetch Requests (Using Collection Logic to prevent 404)
    try {
        const colRes = await api.get(`/collections/workspace/${workspaceId}`);
        const collections = colRes.data || [];

        // Add Collections themselves
        collections.forEach((c: any) => index.push({
            id: c.id, type: 'collection', name: c.name, label: 'Collection', icon: Folder
        }));

        // Fetch Requests for each collection (Parallel)
        await Promise.all(collections.map(async (col: any) => {
            try {
                const reqRes = await api.get(`/requests/collection/${col.id}`);
                const requests = reqRes.data || [];
                requests.forEach((r: any) => index.push({
                    id: r.id, 
                    type: 'request', 
                    name: r.name, 
                    method: r.method, 
                    label: 'Request', 
                    meta: col.name, // Show Collection name as meta
                    icon: FileCode
                }));
            } catch (err) { /* Ignore empty collections */ }
        }));

    } catch (e) { console.warn("Search index partial load failed", e); }

    // 4. Fetch Mock Servers (Safe fetch)
    try {
        const mockRes = await api.get(`/mocks/servers/workspace/${workspaceId}`);
        if (Array.isArray(mockRes.data)) {
            mockRes.data.forEach((m: any) => index.push({
                id: m.id, type: 'mock', name: m.name, label: 'Mock Server', icon: Server
            }));
        }
    } catch (e) { /* Ignore */ }

    setSearchIndex(index);
  };

  // --- 🔍 FILTER LOGIC ---
  const filteredResults = useMemo(() => {
      if (!searchQuery.trim()) return [];
      const q = searchQuery.toLowerCase();
      
      return searchIndex.filter(item => 
          item.name.toLowerCase().includes(q) || 
          item.method?.toLowerCase().includes(q) ||
          item.meta?.toLowerCase().includes(q)
      ).slice(0, 20); // Limit results for performance
  }, [searchQuery, searchIndex]);


  const handleResultClick = (item: SearchItem) => {
      if (item.type === 'request') {
          setActiveModule("requests");
          setActiveEditor("request-editor");
          setActiveEntityId(item.id);
      } else if (item.type === 'mock') {
          setActiveModule("mocks");
          setActiveEditor("server-config");
          setActiveEntityId(item.id);
      } else if (item.type === 'env') {
          handleEnvChange(item.id.toString());
      } else if (item.type === 'workspace') {
          const ws = workspaces.find(w => w.id === item.id);
          if (ws) handleSwitchWorkspace(ws);
      }
      
      setIsSearchOpen(false);
      setSearchQuery("");
  };

  // --- STANDARD HELPERS ---
  const getMethodBadge = (method: string) => {
      const colors: any = {
          GET: "text-green-600 bg-green-50 border-green-200",
          POST: "text-blue-600 bg-blue-50 border-blue-200",
          PUT: "text-orange-600 bg-orange-50 border-orange-200",
          DELETE: "text-red-600 bg-red-50 border-red-200"
      };
      return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colors[method] || "border-border"}`}>{method}</span>;
  };

  const initializeDashboard = async () => {
    try {
        const wsRes = await api.get("/workspaces/my-workspaces");
        setWorkspaces(wsRes.data);
        if (wsRes.data.length > 0) {
            const savedWsId = localStorage.getItem("activeWorkspaceId");
            let targetWs = wsRes.data[0];
            if (savedWsId) {
                const found = wsRes.data.find((w: any) => w.id.toString() === savedWsId);
                if (found) targetWs = found;
            }
            setActiveWorkspace(targetWs);
            localStorage.setItem("activeWorkspaceId", targetWs.id.toString());
            loadEnvironments(targetWs.id);
        }
    } catch(e) { console.error(e); }
  };

  const loadEnvironments = async (workspaceId: number) => {
    try {
        const envRes = await api.get(`/environments/workspace/${workspaceId}`);
        setEnvs(envRes.data);
        const savedEnvId = localStorage.getItem("activeEnvId");
        if (savedEnvId && envRes.data.some((e: any) => e.id.toString() === savedEnvId)) {
            setActiveEnvId(savedEnvId);
        } else {
            setActiveEnvId("none"); 
        }
    } catch (e) { console.error(e); }
  };

  const loadUserProfile = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        try {
            const u = JSON.parse(storedUser);
            const displayName = u.fullName || u.firstName || u.email || "User";
            const initials = displayName.substring(0, 2).toUpperCase();
            setCurrentUser({
                name: displayName,
                role: u.roles && u.roles.includes("ROLE_ADMIN") ? "Admin" : "Member",
                initials: initials
            });
        } catch (e) {}
    }
  };

  const handleSwitchWorkspace = async (ws: any) => {
    setActiveWorkspace(ws);
    localStorage.setItem("activeWorkspaceId", ws.id.toString());
    try {
        await loadEnvironments(ws.id);
        window.location.reload(); 
    } catch (error) { console.error(error); }
  };

  const handleEnvChange = (val: string) => {
    setActiveEnvId(val);
    localStorage.setItem("activeEnvId", val);
    const env = envs.find(e => e.id.toString() === val);
    localStorage.setItem("activeEnvVars", env ? env.variables : "{}");
    window.dispatchEvent(new Event("env-change"));
  };

 const handleLogout = () => {
    localStorage.clear(); // Clear client state
    deleteCookie("token"); // Clear middleware state
    router.push("/login"); 
};

  const handleGoToProfile = () => {
      setActiveModule("settings");
      setActiveEditor("settings-editor");
      setActiveEntityId("account");
  };

  const handleGoToSettings = () => {
      setActiveModule("settings");
      setActiveEditor("settings-editor");
      setActiveEntityId("general");
  };

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur z-50 sticky top-0 px-4 flex items-center justify-between gap-4">
      
      {/* 1. Branding */}
      <div className="flex items-center gap-3 min-w-max">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-foreground select-none">
            <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            APIForge
        </div>
        <div className="h-4 w-[1px] bg-border mx-2"></div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 gap-2 text-sm font-medium text-muted-foreground hover:text-foreground px-2 max-w-[200px]">
                    <span className="truncate">{activeWorkspace?.name || "Select Workspace"}</span>
                    <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider">My Workspaces</DropdownMenuLabel>
                {workspaces.map(ws => (
                    <DropdownMenuItem key={ws.id} onClick={() => handleSwitchWorkspace(ws)} className="flex items-center justify-between cursor-pointer">
                        <span className="truncate">{ws.name}</span>
                        {activeWorkspace?.id === ws.id && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2 text-primary focus:text-primary font-medium" onClick={() => setShowWorkspaceDialog(true)}>
                    <Plus className="h-3.5 w-3.5" /> Create Workspace
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Client-Side Search */}
      <div className="flex-1 max-w-md hidden md:block relative z-50" ref={searchRef}>
        <div className="relative group">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder={`Search ${searchIndex.length > 0 ? searchIndex.length : ''} resources...`} 
            className="w-full h-9 pl-9 pr-10 rounded-md border border-input/60 bg-muted/20 text-sm shadow-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background transition-all" 
            value={searchQuery}
            onChange={(e) => {
                setSearchQuery(e.target.value);
                if(e.target.value.length > 0) setIsSearchOpen(true);
            }}
            onFocus={() => { if(searchQuery.length > 0) setIsSearchOpen(true); }}
          />
          {searchQuery && (
             <button onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }} className="absolute right-2.5 top-2.5 hover:text-foreground text-muted-foreground">
                <X className="h-4 w-4" />
             </button>
          )}
          {!searchQuery && <kbd className="absolute right-2.5 top-2.5 pointer-events-none inline-flex h-4 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-60">⌘K</kbd>}
        </div>

        {/* Results Dropdown */}
        {isSearchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ring-1 ring-border">
                {filteredResults.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto py-1">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30 mb-1 flex justify-between">
                            <span>Top Matches</span>
                            <span>{filteredResults.length} found</span>
                        </div>
                        {filteredResults.map((item, idx) => (
                            <div 
                                key={`${item.type}-${item.id}-${idx}`}
                                onClick={() => handleResultClick(item)}
                                className="group flex items-center gap-3 px-3 py-2.5 mx-1 rounded-md cursor-pointer hover:bg-muted/80 transition-all duration-200"
                            >
                                <div className={`
                                    h-8 w-8 flex items-center justify-center rounded-md shrink-0 border shadow-sm
                                    ${item.type === 'request' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800' : 
                                      item.type === 'env' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border-green-100 dark:border-green-800' : 
                                      item.type === 'mock' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-800' :
                                      'bg-background text-muted-foreground border-border'}
                                `}>
                                    <item.icon className="h-4 w-4" />
                                </div>

                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-sm truncate text-foreground">
                                            <Highlight text={item.name} highlight={searchQuery} />
                                        </div>
                                        {item.method && getMethodBadge(item.method)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                                        <span>{item.label}</span>
                                        {item.meta && (
                                            <>
                                                <span className="opacity-50">•</span>
                                                <span className="truncate opacity-80">{item.meta}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Search className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">No results found</p>
                        <p className="text-xs text-muted-foreground">Try a different keyword.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* 3. Actions */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-2 bg-muted/20 p-1 rounded-md border border-input/20 mr-2">
             <div className="flex items-center px-2 text-xs font-medium text-muted-foreground gap-2"><Eye className="h-3.5 w-3.5" /></div>
             <Select value={activeEnvId} onValueChange={handleEnvChange}>
                <SelectTrigger className="h-7 w-[140px] text-xs border-0 bg-transparent shadow-none focus:ring-0"><SelectValue placeholder="No Environment" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">No Environment</SelectItem>
                    {envs.map(env => (<SelectItem key={env.id} value={env.id.toString()}>{env.name}</SelectItem>))}
                </SelectContent>
             </Select>
        </div>

        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative"><Bell className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]"><DropdownMenuLabel>Notifications</DropdownMenuLabel><DropdownMenuSeparator />{notifications.map(n => (<DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer"><span className="font-medium text-sm">{n.text}</span><span className="text-xs text-muted-foreground">{n.time}</span></DropdownMenuItem>))}</DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <div className="h-4 w-[1px] bg-border mx-2"></div>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 pl-1 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="text-right hidden md:block leading-tight">
                        <p className="text-sm font-medium">{currentUser.name}</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{currentUser.role}</p>
                    </div>
                    <Avatar className="h-8 w-8 border shadow-sm">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/5 text-xs font-bold text-primary">{currentUser.initials}</AvatarFallback>
                    </Avatar>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleGoToProfile}><User className="h-4 w-4" /> Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={handleGoToSettings}><Settings className="h-4 w-4" /> Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600" onClick={handleLogout}><LogOut className="h-4 w-4" /> Log out</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateWorkspaceDialog open={showWorkspaceDialog} onOpenChange={setShowWorkspaceDialog} onSuccess={() => { initializeDashboard(); }} />
    </header>
  );
}