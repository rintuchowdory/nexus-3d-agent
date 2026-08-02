"use client";

import { useAgentStore } from "../../lib/store/agent-store";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export function UsageChart() {
  const events = useAgentStore((s) => s.events);

  const data = events.map((e, i) => ({
    step: i,
    time: e.duration || 0,
    label: e.message.slice(0, 20),
  }));

  return (
    <div className="bg-nexus-panel border border-nexus-border rounded-xl p-4 h-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-nexus-muted uppercase tracking-wider">
          Execution Time per Step
        </span>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[150px] items-center justify-center">
          <span className="text-nexus-muted text-xs font-mono">No data yet</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#00D9FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2030" />
            <XAxis dataKey="step" stroke="#6B7790" fontSize={10} />
            <YAxis stroke="#6B7790" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0B0F1A",
                border: "1px solid #1A2030",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="time"
              stroke="#00D9FF"
              fill="url(#timeGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
