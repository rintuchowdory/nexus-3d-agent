"use client";

import { useAgentStore } from "@/lib/store/agent-store";
import { formatDuration } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2, Circle, Brain } from "lucide-react";
import type { AgentEvent } from "@/types/agent-events";

const EVENT_ICONS = {
  plan: Brain,
  tool_call: Loader2,
  tool_result: CheckCircle2,
  error: XCircle,
  thinking: Loader2,
  complete: CheckCircle2,
};

export function ExecutionTimeline() {
  const events = useAgentStore((s) => s.events);
  const isProcessing = useAgentStore((s) => s.isProcessing);

  return (
    <div className="bg-nexus-panel border border-nexus-border rounded-xl h-full overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-nexus-border">
        <span className="font-mono text-sm text-nexus-text">Execution Timeline</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {events.length === 0 ? (
          <div className="text-center py-6">
            <Circle className="w-6 h-6 text-nexus-muted/30 mx-auto mb-2" />
            <p className="text-nexus-muted text-xs font-mono">
              Waiting for task...
            </p>
          </div>
        ) : (
          events.map((event) => <TimelineItem key={event.id} event={event} />)
        )}
        {isProcessing && events.length > 0 && (
          <div className="flex items-center gap-2 text-nexus-accent text-xs font-mono pt-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ event }: { event: AgentEvent }) {
  const Icon = EVENT_ICONS[event.type] || Circle;
  const iconColor =
    event.status === "completed" ? "text-nexus-success" :
    event.status === "failed" ? "text-nexus-error" :
    event.status === "active" ? "text-nexus-accent" :
    "text-nexus-muted";

  return (
    <div className="flex items-start gap-2 py-1.5 text-xs font-mono">
      <Icon
        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${iconColor} ${
          event.status === "active" ? "animate-spin" : ""
        }`}
      />
      <div className="flex-1 min-w-0">
        <span className={event.status === "failed" ? "text-nexus-error" : "text-nexus-text"}>
          {event.message}
        </span>
        {event.duration !== undefined && event.duration > 0 && (
          <span className="text-nexus-muted ml-2">{formatDuration(event.duration)}</span>
        )}
      </div>
    </div>
  );
}
