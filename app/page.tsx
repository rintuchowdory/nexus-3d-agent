"use client";

import Link from "next/link";
import { Activity, Boxes, Workflow, MessageSquare, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-8">
      <div className="max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-nexus-accent/10 border border-nexus-accent/20 mb-8">
          <span className="w-2 h-2 rounded-full bg-nexus-accent animate-pulse" />
          <span className="font-mono text-xs text-nexus-accent tracking-wider">
            AI AGENT CONTROL CENTER
          </span>
        </div>

        <h1 className="font-display text-6xl font-bold tracking-tight mb-4">
          <span className="glow-text text-nexus-accent">NEXUS</span>
          <span className="text-nexus-text">-3D</span>
        </h1>

        <p className="text-lg text-nexus-muted max-w-xl mx-auto mb-10">
          Give one instruction. Watch the AI agent execute in real-time through an
          interactive 3D network. Every tool call, every decision, visualized.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Boxes, label: "3D Agent Core" },
            { icon: Activity, label: "Live Timeline" },
            { icon: Workflow, label: "Workflow Editor" },
            { icon: MessageSquare, label: "Streaming Chat" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-nexus-panel border border-nexus-border"
            >
              <item.icon className="w-6 h-6 text-nexus-accent" />
              <span className="font-mono text-xs text-nexus-muted">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-nexus-accent/20 border border-nexus-accent/40 text-nexus-accent px-8 py-3 rounded-xl font-mono text-sm hover:bg-nexus-accent/30 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Launch Dashboard
          </Link>
          <Link
            href="/workflows"
            className="inline-flex items-center justify-center gap-2 bg-nexus-panel border border-nexus-border text-nexus-muted px-8 py-3 rounded-xl font-mono text-sm hover:border-nexus-accent/40 hover:text-nexus-accent transition-colors"
          >
            <Workflow className="w-4 h-4" />
            Workflow Editor
          </Link>
        </div>
      </div>
    </div>
  );
}
