"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import api from "@/lib/api";
import {
  FolderGit2,
  Server,
  Globe,
  Settings,
  Activity,
  FileText,
  Clock,
  Zap,
  Plus,
  ArrowRight,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ------------------ Middle Pane (Explorers) ------------------ */
import RequestExplorer from "@/components/explorer/RequestExplorer";
import MockExplorer from "@/components/explorer/MockExplorer";
import EnvironmentExplorer from "@/components/explorer/EnvironmentExplorer";
import LogExplorer from "@/components/explorer/LogExplorer";
import HistoryExplorer from "@/components/explorer/HistoryExplorer";
import SettingsExplorer from "@/components/explorer/SettingsExplorer";

/* ------------------ Right Pane (Editors / Viewers) ------------------ */
import RequestEditor from "@/components/request/RequestEditor";
import MockRouteEditor from "@/components/mock/MockRouteEditor";
import MockServerEditor from "@/components/mock/MockServerEditor";
import EnvEditor from "@/components/env/EnvEditor";
import LogViewer from "@/components/logs/LogViewer";
import HistoryViewer from "@/components/history/HistoryViewer";
import SettingsEditor from "@/components/settings/SettingsEditor";

export default function DashboardShell() {
  const { activeModule, setActiveModule, activeEditor, activeEntityId } =
    useDashboard();

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-background">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside
        className="
          group flex flex-col gap-2
          border-r bg-muted/10 z-20 shrink-0
          w-14 hover:w-56
          transition-all duration-300 ease-in-out
          py-4 overflow-hidden
        "
      >
        <NavButton
          icon={<FolderGit2 size={18} />}
          label="Requests"
          active={activeModule === "requests"}
          onClick={() => setActiveModule("requests")}
        />

        <NavButton
          icon={<Server size={18} />}
          label="Mock Server"
          active={activeModule === "mocks"}
          onClick={() => setActiveModule("mocks")}
        />

        <NavButton
          icon={<Globe size={18} />}
          label="Environments"
          active={activeModule === "environments"}
          onClick={() => setActiveModule("environments")}
        />

        <div className="my-2 mx-3 border-t border-border/40" />

        <NavButton
          icon={<FileText size={18} />}
          label="System Logs"
          active={activeModule === "logs"}
          onClick={() => setActiveModule("logs")}
        />

        <NavButton
          icon={<Clock size={18} />}
          label="Request History"
          active={activeModule === "history"}
          onClick={() => setActiveModule("history")}
        />

        <div className="mt-auto">
          <NavButton
            icon={<Settings size={18} />}
            label="Settings"
            active={activeModule === "settings"}
            onClick={() => setActiveModule("settings")}
          />
        </div>
      </aside>

      {/* ================= MIDDLE EXPLORER ================= */}
      <aside className="w-[280px] border-r bg-muted/5 flex flex-col shrink-0">
        {activeModule === "requests" && <RequestExplorer />}
        {activeModule === "mocks" && <MockExplorer />}
        {activeModule === "environments" && <EnvironmentExplorer />}
        {activeModule === "logs" && <LogExplorer />}
        {activeModule === "history" && <HistoryExplorer />}
        {activeModule === "settings" && <SettingsExplorer />}
      </aside>

      {/* ================= RIGHT EDITOR ================= */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto">
        {activeEditor === "request-editor" && activeEntityId && (
          <RequestEditor requestId={activeEntityId as number} />
        )}

        {activeEditor === "mock-route-editor" && activeEntityId && (
          <MockRouteEditor
            routeId={activeEntityId as number}
            onUpdate={() => {}}
          />
        )}

        {activeEditor === "server-config" && activeEntityId && (
          <MockServerEditor serverId={activeEntityId as number} />
        )}

        {activeEditor === "env-editor" && activeEntityId && (
          <EnvEditor envId={activeEntityId as number} />
        )}

        {activeEditor === "log-viewer" && activeEntityId && (
          <LogViewer logId={activeEntityId as number} />
        )}

        {activeEditor === "history-viewer" && activeEntityId && (
          <HistoryViewer historyId={activeEntityId as number} />
        )}

        {activeEditor === "settings-editor" && activeEntityId && (
          <SettingsEditor category={activeEntityId as string} />
        )}

        {/* 🏠 DASHBOARD HOME */}
        {activeEditor === "empty" && <DashboardHome />}
      </main>
    </div>
  );
}

/* ================= 🏠 DASHBOARD HOME COMPONENT ================= */

function DashboardHome() {
  const { setActiveModule, activeWorkspaceId } = useDashboard();
  const [stats, setStats] = useState({ collections: 0, mocks: 0, historyCount: 0 });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [workspaceName, setWorkspaceName] = useState("Loading...");
  const [userName, setUserName] = useState("User");
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    // 1. Determine Time-Based Greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // 2. Get User Name from LocalStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
        try {
            const u = JSON.parse(storedUser);
            // Prioritize First Name -> Full Name -> "User"
            setUserName(u.firstName || u.fullName || "User");
        } catch(e) {}
    }

    if (activeWorkspaceId) loadData();
  }, [activeWorkspaceId]);

  const loadData = async () => {
    try {
        const wsRes = await api.get("/workspaces/my-workspaces");
        const currentWs = wsRes.data.find((w: any) => w.id === activeWorkspaceId) || wsRes.data[0];
        setWorkspaceName(currentWs?.name || "Workspace");

        if (currentWs) {
            const [colRes, mockRes, histRes] = await Promise.all([
                api.get(`/collections/workspace/${currentWs.id}`),
                api.get(`/mocks/servers/workspace/${currentWs.id}`),
                api.get("/history/me")
            ]);

            setStats({
                collections: colRes.data.length,
                mocks: mockRes.data.length,
                historyCount: histRes.data.length
            });
            setRecentHistory(histRes.data.slice(0, 5));
        }
    } catch (e) {
        console.error("Dashboard Load Failed", e);
        setWorkspaceName("APIForge");
    }
  };

  const getStatusColor = (s: number) => {
    if (s >= 500) return "text-red-600 bg-red-50 dark:bg-red-900/20";
    if (s >= 400) return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
    return "text-green-600 bg-green-50 dark:bg-green-900/20";
  };

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
            {/* 👋 Dynamic Greeting */}
            <h1 className="text-3xl font-bold tracking-tight">
                {greeting}, {userName}
            </h1>
            <p className="text-muted-foreground mt-1">
                Here is what&apos;s happening in <span className="font-semibold text-foreground">{workspaceName}</span> today.
            </p>
        </div>
        <Button onClick={() => setActiveModule("requests")} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> New Request
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
            title="Total Collections" 
            value={stats.collections} 
            icon={<FolderGit2 className="h-4 w-4 text-blue-500" />} 
            desc="API projects organized"
        />
        <StatsCard 
            title="Active Mock Servers" 
            value={stats.mocks} 
            icon={<Server className="h-4 w-4 text-orange-500" />} 
            desc="Virtual backends running"
        />
        <StatsCard 
            title="Total Requests" 
            value={stats.historyCount} 
            icon={<Activity className="h-4 w-4 text-green-500" />} 
            desc="Lifetime execution count"
        />
      </div>

      {/* Activity & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent History */}
        <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" /> Recent Activity
                </h3>
                <Button variant="link" onClick={() => setActiveModule("history")} className="text-xs h-auto p-0">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
            </div>
            
            <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                {recentHistory.length > 0 ? (
                    <div className="divide-y">
                        {recentHistory.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-sm group cursor-default">
                                 <div className="flex items-center gap-4 min-w-0">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold font-mono border w-14 text-center ${item.method === 'GET' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                        {item.method}
                                    </span>
                                    <span className="font-mono text-muted-foreground truncate group-hover:text-foreground transition-colors">
                                        {item.url}
                                    </span>
                                 </div>
                                 <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                    <span>{item.durationMs}ms</span>
                                    <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                 </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                        <Activity className="h-8 w-8 opacity-20" />
                        <p>No requests sent yet.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" /> Quick Actions
            </h3>
            <div className="grid gap-3">
                <ActionCard 
                    icon={<Zap className="h-5 w-5 text-orange-600" />}
                    bg="bg-orange-100 dark:bg-orange-900/30"
                    title="Create Mock API"
                    desc="Simulate endpoints"
                    onClick={() => setActiveModule("mocks")}
                />
                <ActionCard 
                    icon={<Globe className="h-5 w-5 text-blue-600" />}
                    bg="bg-blue-100 dark:bg-blue-900/30"
                    title="Manage Environments"
                    desc="Global variables"
                    onClick={() => setActiveModule("environments")}
                />
                <ActionCard 
                    icon={<Settings className="h-5 w-5 text-gray-600" />}
                    bg="bg-gray-100 dark:bg-gray-800"
                    title="Workspace Settings"
                    desc="Configure access"
                    onClick={() => setActiveModule("settings")}
                />
            </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, desc }: any) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </CardContent>
        </Card>
    )
}

function ActionCard({ icon, bg, title, desc, onClick }: any) {
    return (
        <div 
            onClick={onClick}
            className="p-4 border rounded-xl hover:bg-muted/50 cursor-pointer transition-all flex items-center gap-4 group shadow-sm hover:shadow-md hover:border-primary/20"
        >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                {icon}
            </div>
            <div>
                <div className="font-medium text-sm group-hover:text-primary transition-colors">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
        </div>
    )
}

/* ================= NAV BUTTON ================= */

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <div className="px-2 w-full">
      <Button
        variant="ghost"
        onClick={onClick}
        className={`
          relative h-10 w-full
          flex items-center
          justify-start
          pl-3 pr-3
          transition-colors duration-200
          ${
            active
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }
        `}
      >
        <span className="w-6 h-6 flex items-center justify-center shrink-0">
          {icon}
        </span>
        <span
          className="
            ml-3
            overflow-hidden whitespace-nowrap
            max-w-0 opacity-0 translate-x-[-10px]
            group-hover:max-w-[160px]
            group-hover:opacity-100
            group-hover:translate-x-0
            transition-all duration-300
            ease-[cubic-bezier(0.4,0,0.2,1)]
            text-sm font-medium
          "
        >
          {label}
        </span>
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />
        )}
      </Button>
    </div>
  );
}