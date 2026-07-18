"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import { useDashboard } from "@/context/DashboardContext";
import api from "@/lib/api";
import {
  FileCode2, Server, Globe, Settings as SettingsIcon, Clock, FileText,
  Plus, Sun, Moon, Search as SearchIcon,
} from "lucide-react";

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords?: string;
  action: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [entities, setEntities] = useState<PaletteItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { theme, setTheme } = useTheme();
  const {
    activeWorkspaceId, setActiveModule,
    openRequest, openMockServer, openEnvironment, openSettings, openScratchpad,
  } = useDashboard();

  // Global ⌘K / Ctrl+K toggle, from anywhere in the app.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 10);
      if (activeWorkspaceId) loadEntities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeWorkspaceId]);

  const loadEntities = useCallback(async () => {
    if (!activeWorkspaceId) return;
    try {
      const [colRes, mockRes, envRes] = await Promise.all([
        api.get(`/collections/workspace/${activeWorkspaceId}`),
        api.get(`/mocks/servers/workspace/${activeWorkspaceId}`),
        api.get(`/environments/workspace/${activeWorkspaceId}`),
      ]);

      const items: PaletteItem[] = [];

      for (const col of colRes.data) {
        try {
          const reqRes = await api.get(`/requests/collection/${col.id}`, { params: { page: 0, size: 200 } });
          for (const req of reqRes.data.data) {
            items.push({
              id: `req-${req.id}`,
              label: req.name,
              hint: `${req.method} · ${col.name}`,
              icon: <FileCode2 className="h-4 w-4" />,
              keywords: `${req.method} ${req.url}`,
              action: () => openRequest(req.id, req.name),
            });
          }
        } catch { /* skip a collection that fails to load, don't block the rest */ }
      }

      for (const server of mockRes.data) {
        items.push({
          id: `mock-${server.id}`,
          label: server.name,
          hint: "Mock server",
          icon: <Server className="h-4 w-4" />,
          action: () => openMockServer(server.id, server.name),
        });
      }

      for (const env of envRes.data) {
        items.push({
          id: `env-${env.id}`,
          label: env.name,
          hint: "Environment",
          icon: <Globe className="h-4 w-4" />,
          action: () => openEnvironment(env.id, env.name),
        });
      }

      setEntities(items);
    } catch (e) {
      console.error("Failed to build command palette index", e);
    }
  }, [activeWorkspaceId, openRequest, openMockServer, openEnvironment]);

  const staticActions: PaletteItem[] = useMemo(() => [
    {
      id: "action-new-scratchpad",
      label: "New Scratchpad request",
      icon: <Plus className="h-4 w-4" />,
      keywords: "new create request scratch",
      action: openScratchpad,
    },
    {
      id: "action-toggle-theme",
      label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      keywords: "theme dark light appearance",
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
    {
      id: "action-goto-requests",
      label: "Go to Collections",
      icon: <FileCode2 className="h-4 w-4" />,
      action: () => setActiveModule("requests"),
    },
    {
      id: "action-goto-mocks",
      label: "Go to Mock Servers",
      icon: <Server className="h-4 w-4" />,
      action: () => setActiveModule("mocks"),
    },
    {
      id: "action-goto-envs",
      label: "Go to Environments",
      icon: <Globe className="h-4 w-4" />,
      action: () => setActiveModule("environments"),
    },
    {
      id: "action-goto-history",
      label: "Go to History",
      icon: <Clock className="h-4 w-4" />,
      action: () => setActiveModule("history"),
    },
    {
      id: "action-goto-logs",
      label: "Go to Mock Logs",
      icon: <FileText className="h-4 w-4" />,
      action: () => setActiveModule("logs"),
    },
    {
      id: "action-goto-settings",
      label: "Open Settings",
      icon: <SettingsIcon className="h-4 w-4" />,
      action: () => openSettings("general"),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [theme]);

  const allItems = useMemo(() => [...staticActions, ...entities], [staticActions, entities]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.hint?.toLowerCase().includes(q) ||
      item.keywords?.toLowerCase().includes(q)
    );
  }, [query, allItems]);

  const runItem = (item: PaletteItem) => {
    item.action();
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selected]) runItem(filtered[selected]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-popover border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b h-12">
          <SearchIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search requests, mocks, environments, or run a command…"
            className="flex-1 bg-transparent outline-none text-sm h-full"
          />
          <kbd className="text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">No matches.</div>
          )}
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              onMouseEnter={() => setSelected(idx)}
              onClick={() => runItem(item)}
              className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer ${
                idx === selected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60"
              }`}
            >
              <span className="opacity-70">{item.icon}</span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.hint && <span className="text-xs text-muted-foreground shrink-0">{item.hint}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
