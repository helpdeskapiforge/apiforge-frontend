"use client";
import { useDashboard } from "@/context/DashboardContext";
import { User, Briefcase, Sliders, Shield } from "lucide-react";

export default function SettingsExplorer() {
  const { setActiveEditor, setActiveEntityId, activeEntityId } = useDashboard();

  const menuItems = [
    { id: "general", label: "General", icon: Sliders },
    { id: "workspace", label: "Workspace", icon: Briefcase },
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
  ];

  const handleSelect = (id: string) => {
    setActiveEditor("settings-editor");
    setActiveEntityId(id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b shrink-0">
        <span className="text-xs font-bold text-muted-foreground uppercase px-1">Settings</span>
      </div>
      <div className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer text-sm transition-colors ${
              activeEntityId === item.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4 opacity-70" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}