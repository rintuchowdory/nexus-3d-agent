"use client";

import dynamic from "next/dynamic";
import { AgentChat } from "@/components/agent-chat/AgentChat";
import { ExecutionTimeline } from "@/components/dashboard/ExecutionTimeline";
import { PerformanceCards } from "@/components/dashboard/PerformanceCards";
import { StatusBar } from "@/components/dashboard/StatusBar";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { Suspense } from "react";

// Dynamically import 3D scene to avoid SSR issues
const AgentScene = dynamic(
  () => import("@/components/three/AgentScene").then((m) => m.AgentScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <span className="font-mono text-sm text-nexus-muted animate-pulse">
          Initializing 3D Core...
        </span>
      </div>
    ),
  }
);

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col grid-bg">
      {/* Top bar */}
      <header className="px-6 py-3 border-b border-nexus-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-bold text-nexus-accent glow-text">
            NEXUS-3D
          </span>
          <span className="font-mono text-xs text-nexus-muted">CONTROL CENTER</span>
        </div>
        <StatusBar />
      </header>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-12 gap-3 p-3 min-h-0">
        {/* Left: 3D Scene (6 cols) */}
        <div className="col-span-12 lg:col-span-5 bg-nexus-panel border border-nexus-border rounded-xl overflow-hidden relative min-h-[300px]">
          <div className="absolute top-3 left-3 z-10">
            <span className="font-mono text-[10px] text-nexus-muted uppercase tracking-wider">
              Agent Core — 3D Visualization
            </span>
          </div>
          <AgentScene />
        </div>

        {/* Center: Chat (4 cols) */}
        <div className="col-span-12 lg:col-span-4 min-h-[300px]">
          <AgentChat />
        </div>

        {/* Right: Timeline (3 cols) */}
        <div className="col-span-12 lg:col-span-3 min-h-[300px]">
          <ExecutionTimeline />
        </div>
      </div>

      {/* Bottom: Performance cards + chart */}
      <div className="border-t border-nexus-border p-3 space-y-3">
        <PerformanceCards />
        <UsageChart />
      </div>
    </div>
  );
}
