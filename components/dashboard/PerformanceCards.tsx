"use client";

import { useAgentStore } from "@/lib/store/agent-store";
import { formatDuration, formatCost } from "@/lib/utils";
import { Clock, Hash, DollarSign, CheckCircle2, XCircle } from "lucide-react";

export function PerformanceCards() {
  const { metrics } = useAgentStore();

  const cards = [
    { label: "Response Time", value: formatDuration(metrics.responseTime), icon: Clock, color: "text-nexus-accent" },
    { label: "Tokens", value: metrics.tokens.toLocaleString(), icon: Hash, color: "text-nexus-warning" },
    { label: "Cost", value: formatCost(metrics.cost), icon: DollarSign, color: "text-nexus-success" },
    { label: "Completed", value: metrics.completedTasks.toString(), icon: CheckCircle2, color: "text-nexus-success" },
    { label: "Failed", value: metrics.failedTasks.toString(), icon: XCircle, color: "text-nexus-error" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-nexus-panel border border-nexus-border rounded-xl p-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
            <span className="text-[10px] font-mono text-nexus-muted uppercase tracking-wider">
              {card.label}
            </span>
          </div>
          <span className="text-lg font-mono font-bold text-nexus-text">
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
}
