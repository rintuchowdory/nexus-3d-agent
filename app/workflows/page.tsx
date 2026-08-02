"use client";

import { WorkflowEditor } from "../../components/workflow-editor/WorkflowEditor";
import { useState } from "react";
import { Save, Play, Plus, Github, Search, FileCode, Cloud, Database } from "lucide-react";

const PRESETS = [
  { name: "Analyse GitHub Repository", icon: Github, nodes: ["Input", "Router", "GitHub Agent", "Verifier", "Output"] },
  { name: "Fix Docker Deployment", icon: Cloud, nodes: ["Input", "Router", "Docker Agent", "Deploy Agent", "Output"] },
  { name: "Generate Documentation", icon: FileCode, nodes: ["Input", "Router", "GitHub Agent", "File Analysis", "Output"] },
  { name: "Search & Research", icon: Search, nodes: ["Input", "Router", "Web Research", "Verifier", "Output"] },
];

export default function WorkflowsPage() {
  const [selectedPreset, setSelectedPreset] = useState(0);

  return (
    <div className="h-screen flex flex-col grid-bg">
      <header className="px-6 py-3 border-b border-nexus-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-bold text-nexus-accent glow-text">
            NEXUS-3D
          </span>
          <span className="font-mono text-xs text-nexus-muted">/ WORKFLOWS</span>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-nexus-panel border border-nexus-border text-nexus-muted px-4 py-2 rounded-lg font-mono text-xs hover:border-nexus-accent/40 hover:text-nexus-accent transition-colors">
            <Save className="w-3.5 h-3.5" />
            Save Workflow
          </button>
          <button className="flex items-center gap-2 bg-nexus-accent/20 border border-nexus-accent/40 text-nexus-accent px-4 py-2 rounded-lg font-mono text-xs hover:bg-nexus-accent/30 transition-colors">
            <Play className="w-3.5 h-3.5" />
            Run Workflow
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-3 p-3 min-h-0">
        {/* Sidebar: Presets */}
        <div className="col-span-12 lg:col-span-3 space-y-2">
          <span className="font-mono text-xs text-nexus-muted uppercase tracking-wider px-1">
            Workflow Templates
          </span>
          {PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => setSelectedPreset(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                selectedPreset === i
                  ? "bg-nexus-accent/10 border-nexus-accent/40 text-nexus-accent"
                  : "bg-nexus-panel border-nexus-border text-nexus-muted hover:border-nexus-accent/20"
              }`}
            >
              <preset.icon className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <span className="font-mono text-xs block">{preset.name}</span>
                <span className="text-[10px] text-nexus-muted/60">
                  {preset.nodes.join(" → ")}
                </span>
              </div>
            </button>
          ))}

          <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-nexus-border text-nexus-muted hover:border-nexus-accent/40 hover:text-nexus-accent transition-colors">
            <Plus className="w-4 h-4" />
            <span className="font-mono text-xs">New Workflow</span>
          </button>
        </div>

        {/* Editor */}
        <div className="col-span-12 lg:col-span-9 min-h-[400px]">
          <WorkflowEditor />
        </div>
      </div>
    </div>
  );
}
