"use client";
import { useState, useRef, useEffect } from "react";
import { useDashboard, Tab } from "@/context/DashboardContext";
import { X, Pin, PinOff, Plus, FileCode2, Server, Globe, FileText, Clock, Settings as SettingsIcon } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function iconFor(editorType: Tab["editorType"]) {
  switch (editorType) {
    case "request-editor":
    case "scratchpad":
      return <FileCode2 className="h-3.5 w-3.5 shrink-0" />;
    case "mock-route-editor":
    case "server-config":
      return <Server className="h-3.5 w-3.5 shrink-0" />;
    case "env-editor":
      return <Globe className="h-3.5 w-3.5 shrink-0" />;
    case "log-viewer":
      return <FileText className="h-3.5 w-3.5 shrink-0" />;
    case "history-viewer":
      return <Clock className="h-3.5 w-3.5 shrink-0" />;
    case "settings-editor":
      return <SettingsIcon className="h-3.5 w-3.5 shrink-0" />;
    default:
      return null;
  }
}

export default function TabStrip() {
  const { tabs, activeTabId, setActiveTabId, closeTab, closeOtherTabs, closeAllTabs, pinTab, openScratchpad } = useDashboard();

  // Which tab's action menu is open. The menu is a controlled DropdownMenu
  // anchored to the tab itself, opened ONLY via right-click / the kebab area --
  // never on a plain left click, otherwise every click to switch tabs would
  // also pop the menu open (that was the original bug here).
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [activeTabId]);

  // Radix's DropdownMenuTrigger actually opens the menu from onPointerDown (not
  // onClick) for mouse input, so that's the event we have to intercept -- calling
  // preventDefault() here stops Radix's own pointerdown handler from firing
  // (composeEventHandlers checks event.defaultPrevented per event type), while a
  // plain onClick handler further down still fires normally to switch tabs.
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button === 1) { closeTab(id); return; } // middle-click closes, like every browser tab
    if (e.button === 0) e.preventDefault();
  };

  const handleSelect = (_e: React.MouseEvent, id: string) => {
    setActiveTabId(id);
  };

  if (tabs.length === 0) {
    return (
      <div className="h-9 border-b bg-muted/10 flex items-center px-2 shrink-0">
        <button
          onClick={openScratchpad}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" /> New tab
        </button>
      </div>
    );
  }

  return (
    <div className="h-9 border-b bg-muted/10 flex items-stretch overflow-x-auto shrink-0 select-none">
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;
        return (
          <DropdownMenu
            key={tab.id}
            open={openMenuId === tab.id}
            onOpenChange={(open) => setOpenMenuId(open ? tab.id : null)}
          >
            <DropdownMenuTrigger asChild>
              <div
                ref={isActive ? activeRef : undefined}
                onClick={(e) => handleSelect(e, tab.id)}
                onPointerDown={(e) => handlePointerDown(e, tab.id)}
                onContextMenu={(e) => { e.preventDefault(); setActiveTabId(tab.id); setOpenMenuId(tab.id); }}
                className={cn(
                  "group flex items-center gap-1.5 px-3 border-r text-xs cursor-pointer max-w-[180px] shrink-0 relative",
                  isActive ? "bg-background text-foreground font-medium" : "text-muted-foreground hover:bg-muted/60"
                )}
                title={tab.title}
              >
                {isActive && <span className="absolute left-0 top-0 h-0.5 w-full bg-primary" />}
                {iconFor(tab.editorType)}
                <span className="truncate">{tab.title}</span>
                {tab.pinned && <Pin className="h-2.5 w-2.5 shrink-0 opacity-60" />}
                <button
                  className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5 shrink-0"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeTab(tab.id); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={`Close ${tab.title}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => closeTab(tab.id)}>Close tab</DropdownMenuItem>
              <DropdownMenuItem onClick={() => closeOtherTabs(tab.id)}>Close other tabs</DropdownMenuItem>
              <DropdownMenuItem onClick={closeAllTabs}>Close all tabs</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => pinTab(tab.id, !tab.pinned)}>
                {tab.pinned
                  ? <span className="flex items-center gap-2"><PinOff className="h-3.5 w-3.5" /> Unpin tab</span>
                  : <span className="flex items-center gap-2"><Pin className="h-3.5 w-3.5" /> Pin tab</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
      <button
        onClick={openScratchpad}
        className="flex items-center px-3 text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0"
        title="New scratchpad tab"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
