"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 1. Module Types (Left Pane / sidebar content)
export type ModuleType =
  | "requests"
  | "mocks"
  | "environments"
  | "logs"
  | "history"
  | "ai"
  | "settings";

// 2. Editor Types (what a tab renders in the main pane)
export type EditorType =
  | "request-editor"
  | "mock-route-editor"
  | "server-config"
  | "env-editor"
  | "log-viewer"
  | "history-viewer"
  | "settings-editor"
  | "scratchpad"
  | "empty";

export interface Tab {
  id: string;
  editorType: EditorType;
  entityId: number | string | null;
  module: ModuleType;
  title: string;
  pinned?: boolean;
}

const TABS_STORAGE_KEY = "apiforge:tabs:v1";
const ACTIVE_TAB_STORAGE_KEY = "apiforge:active-tab:v1";

function loadPersistedTabs(): Tab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface DashboardState {
  // Sidebar module (independent of which tab is active -- you can browse the
  // Mocks tree in the sidebar while a Request tab is open in the main pane)
  activeModule: ModuleType;
  setActiveModule: (mod: ModuleType) => void;

  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  activeTab: Tab | null;
  setActiveTabId: (id: string) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  pinTab: (id: string, pinned: boolean) => void;
  renameTab: (id: string, title: string) => void;

  // Derived, for backward compatibility with existing editor-switch rendering
  activeEditor: EditorType;
  activeEntityId: number | string | null;

  // Workspace State
  activeWorkspaceId: number;
  setActiveWorkspaceId: (id: number) => void;

  // Open-or-focus helpers -- existing call sites across the app don't need to change
  openRequest: (id: number, title?: string) => void;
  openMockRoute: (id: number, title?: string) => void;
  openMockServer: (id: number, title?: string) => void;
  openEnvironment: (id: number, title?: string) => void;
  openLog: (id: number, title?: string) => void;
  openHistory: (id: number, title?: string) => void;
  openSettings: (category: string, title?: string) => void;
  openScratchpad: () => void;

  // Back-compat setters some older components may still call directly
  setActiveEditor: (type: EditorType) => void;
  setActiveEntityId: (id: number | string | null) => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

function DashboardProviderInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeModule, setActiveModule] = useState<ModuleType>("requests");
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabIdState] = useState<string | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number>(0);
  const hasHydrated = useRef(false);

  // Hydrate from localStorage + URL (?active=<tabId>) on mount.
  useEffect(() => {
    const stored = localStorage.getItem("activeWorkspaceId");
    if (stored) setActiveWorkspaceId(parseInt(stored));

    const persistedTabs = loadPersistedTabs();
    setTabs(persistedTabs);

    const urlActive = searchParams.get("active");
    const persistedActive = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    const candidate = urlActive || persistedActive;
    const stillOpen = persistedTabs.find(t => t.id === candidate);
    setActiveTabIdState(stillOpen ? candidate! : (persistedTabs[0]?.id ?? null));

    hasHydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist tabs + sync the active tab into the URL (shareable/refresh-safe),
  // without cramming every open tab into the query string.
  useEffect(() => {
    if (!hasHydrated.current) return;
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
    if (activeTabId) {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTabId);
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("active", activeTabId);
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs, activeTabId]);

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;

  const setActiveTabId = useCallback((id: string) => {
    setActiveTabIdState(id);
    const tab = tabs.find(t => t.id === id);
    if (tab) setActiveModule(tab.module);
  }, [tabs]);

  const openOrFocusTab = useCallback((partial: Omit<Tab, "id">) => {
    setTabs(prev => {
      const existing = prev.find(t => t.editorType === partial.editorType && t.entityId === partial.entityId);
      if (existing) {
        setActiveTabIdState(existing.id);
        return prev;
      }
      const id = `${partial.editorType}-${partial.entityId ?? crypto.randomUUID()}`;
      const next: Tab = { ...partial, id };
      setActiveTabIdState(id);
      return [...prev, next];
    });
    setActiveModule(partial.module);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      if (activeTabId === id) {
        // Focus a sensible neighbor instead of dropping to a blank state.
        const neighbor = next[idx] || next[idx - 1] || next[0] || null;
        setActiveTabIdState(neighbor ? neighbor.id : null);
      }
      return next;
    });
  }, [activeTabId]);

  const closeOtherTabs = useCallback((id: string) => {
    setTabs(prev => prev.filter(t => t.id === id || t.pinned));
    setActiveTabIdState(id);
  }, []);

  const closeAllTabs = useCallback(() => {
    setTabs(prev => prev.filter(t => t.pinned));
    setActiveTabIdState(null);
  }, []);

  const pinTab = useCallback((id: string, pinned: boolean) => {
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, pinned } : t)));
  }, []);

  const renameTab = useCallback((id: string, title: string) => {
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, title } : t)));
  }, []);

  const openRequest = (id: number, title = `Request ${id}`) =>
    openOrFocusTab({ editorType: "request-editor", entityId: id, module: "requests", title });
  const openMockRoute = (id: number, title = `Route ${id}`) =>
    openOrFocusTab({ editorType: "mock-route-editor", entityId: id, module: "mocks", title });
  const openMockServer = (id: number, title = `Server ${id}`) =>
    openOrFocusTab({ editorType: "server-config", entityId: id, module: "mocks", title });
  const openEnvironment = (id: number, title = `Env ${id}`) =>
    openOrFocusTab({ editorType: "env-editor", entityId: id, module: "environments", title });
  const openLog = (id: number, title = `Log ${id}`) =>
    openOrFocusTab({ editorType: "log-viewer", entityId: id, module: "logs", title });
  const openHistory = (id: number, title = `History ${id}`) =>
    openOrFocusTab({ editorType: "history-viewer", entityId: id, module: "history", title });
  const openSettings = (category: string, title = "Settings") =>
    openOrFocusTab({ editorType: "settings-editor", entityId: category, module: "settings", title });
  const openScratchpad = () => {
    // Always a fresh tab -- you can have several "scratch" requests going at once,
    // same as keeping multiple untitled documents open in an editor.
    const uid = crypto.randomUUID();
    const id = `scratchpad-${uid}`;
    setTabs(prev => [...prev, { id, editorType: "scratchpad", entityId: uid, module: "requests", title: "Scratchpad" }]);
    setActiveTabIdState(id);
    setActiveModule("requests");
  };

  // Back-compat shims: a handful of older components may still call these directly
  // instead of going through the open* helpers. They operate on the active tab.
  const setActiveEditor = (type: EditorType) => {
    if (activeTabId) {
      setTabs(prev => prev.map(t => (t.id === activeTabId ? { ...t, editorType: type } : t)));
    }
  };
  const setActiveEntityId = (id: number | string | null) => {
    if (activeTabId) {
      setTabs(prev => prev.map(t => (t.id === activeTabId ? { ...t, entityId: id } : t)));
    }
  };

  return (
    <DashboardContext.Provider value={{
      activeModule, setActiveModule,
      tabs, activeTabId, activeTab, setActiveTabId,
      closeTab, closeOtherTabs, closeAllTabs, pinTab, renameTab,
      activeEditor: activeTab?.editorType ?? "empty",
      activeEntityId: activeTab?.entityId ?? null,
      activeWorkspaceId, setActiveWorkspaceId,
      openRequest, openMockRoute, openMockServer, openEnvironment,
      openLog, openHistory, openSettings, openScratchpad,
      setActiveEditor, setActiveEntityId,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <React.Suspense fallback={null}>
      <DashboardProviderInner>{children}</DashboardProviderInner>
    </React.Suspense>
  );
}

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
};
