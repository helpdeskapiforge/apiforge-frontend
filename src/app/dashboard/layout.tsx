"use client";
import { DashboardProvider } from "@/context/DashboardContext";
import DashboardShell from "@/components/layout/DashboardShell";
// Your EXISTING TopBar remains exactly as is!
import TopBar from "@/components/layout/TopBar"; 


export default function DashboardPage() {
  return (
    <DashboardProvider>
       <div className="flex flex-col h-screen overflow-hidden">
          <TopBar /> 
          <DashboardShell />
       </div>
    </DashboardProvider>
  );
}