"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

// 1. Module Types (Left Pane)
export type ModuleType = 
  | "requests" 
  | "mocks" 
  | "environments" 
  | "logs" 
  | "history" 
  | "settings";

// 2. Editor Types (Right Pane)
export type EditorType = 
  | "request-editor" 
  | "mock-route-editor" 
  | "server-config" 
  | "env-editor" 
  | "log-viewer" 
  | "history-viewer"
  | "settings-editor" // <--- Added
  | "empty";

interface DashboardState {
  // Navigation State
  activeModule: ModuleType;
  setActiveModule: (mod: ModuleType) => void;

  // Editor State
  activeEditor: EditorType;
  setActiveEditor: (type: EditorType) => void;
  
  // ID can be number (DB IDs) or string (Settings categories e.g., "general")
  activeEntityId: number | string | null; 
  setActiveEntityId: (id: number | string | null) => void;
  
  // Workspace State
  activeWorkspaceId: number; 
  setActiveWorkspaceId: (id: number) => void;

  // Action Shortcuts
  openRequest: (id: number) => void;
  openMockRoute: (id: number) => void;
  openMockServer: (id: number) => void;
  openEnvironment: (id: number) => void;
  openLog: (id: number) => void;
  openHistory: (id: number) => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState<ModuleType>("requests");
  const [activeEditor, setActiveEditor] = useState<EditorType>("empty");
  
  // Updated to allow string IDs
  const [activeEntityId, setActiveEntityId] = useState<number | string | null>(null);
  
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<number>(0);

  // Load initial workspace
  useEffect(() => {
    const stored = localStorage.getItem("activeWorkspaceId");
    if(stored) setActiveWorkspaceId(parseInt(stored));
  }, []);

  const openRequest = (id: number) => {
    setActiveModule("requests");
    setActiveEditor("request-editor");
    setActiveEntityId(id);
  };

  const openMockRoute = (id: number) => {
    setActiveModule("mocks");
    setActiveEditor("mock-route-editor");
    setActiveEntityId(id);
  };

  const openMockServer = (id: number) => {
    setActiveModule("mocks");
    setActiveEditor("server-config");
    setActiveEntityId(id);
  };

  const openEnvironment = (id: number) => {
    setActiveModule("environments");
    setActiveEditor("env-editor");
    setActiveEntityId(id);
  };

  const openLog = (id: number) => {
    setActiveModule("logs");
    setActiveEditor("log-viewer");
    setActiveEntityId(id);
  };

  const openHistory = (id: number) => {
    setActiveModule("history");
    setActiveEditor("history-viewer");
    setActiveEntityId(id);
  };

  return (
    <DashboardContext.Provider value={{
      activeModule, setActiveModule,
      activeEditor, setActiveEditor,
      activeEntityId, setActiveEntityId,
      activeWorkspaceId, setActiveWorkspaceId,
      openRequest, openMockRoute, openMockServer, openEnvironment,
      openLog, openHistory
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
};