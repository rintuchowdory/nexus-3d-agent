"use client";

import { useAgentStore } from "../../lib/store/agent-store";
import type { AgentStatus } from "../../types/agent-events";

const STATUS_CONFIG: Record<AgentStatus, { color: string; label: string; dot: string }> = {
  idle: { color: "text-nexus-muted", label: "IDLE", dot: "bg-nexus-muted" },
  thinking: { color: "text-nexus-warning", label: "THINKING", dot: "bg-nexus-warning animate-pulse" },
  tool_call: { color: "text-nexus-accent", label: "EXECUTING", dot: "bg-nexus-accent animate-pulse" },
  success: { color: "text-nexus-success", label: "SUCCESS", dot: "bg-nexus-success" },
  error: { color: "text-nexus-error", label: "ERROR", dot: "bg-nexus-error animate-pulse" },
  waiting: { color: "text-nexus-warning", label: "WAITING", dot: "bg-nexus-warning animate-pulse" },
};

export function StatusBar() {
  const status = useAgentStore((s) => s.status);
  const activeTool = useAgentStore((s) => s.activeTool);
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-nexus-panel border border-nexus-border rounded-xl">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className={`font-mono text-xs font-bold tracking-wider ${config.color}`}>
          {config.label}
        </span>
        {activeTool && (
          <span className="text-nexus-muted font-mono text-xs ml-2">
            → {activeTool.toUpperCase()}
          </span>
        )}
      </div>
      <span className="font-mono text-[10px] text-nexus-muted">
        NEXUS-3D v0.1.0
      </span>
    </div>
  );
}
