"use client";

import { WorkflowEditor } from "../../components/workflow-editor/WorkflowEditor";
import { useWorkflowStore } from "../../lib/store/workflow-store";
import { WORKFLOW_PRESETS } from "../../lib/workflow/presets";
import { Save, Play, Plus, Github, Search, FileCode, Cloud, Loader2 } from "lucide-react";

const PRESET_ICONS = [Github, Cloud, FileCode, Search];

export default function WorkflowsPage() {
  const selectedPreset = useWorkflowStore((s) => s.selectedPreset);
  const task = useWorkflowStore((s) => s.task);
  const setTask = useWorkflowStore((s) => s.setTask);
  const loadPreset = useWorkflowStore((s) => s.loadPreset);
  const loadBlank = useWorkflowStore((s) => s.loadBlank);
  const startRun = useWorkflowStore((s) => s.startRun);
  const save = useWorkflowStore((s) => s.save);
  const running = useWorkflowStore((s) => s.running);
  const stepLogs = useWorkflowStore((s) => s.stepLogs);
  const output = useWorkflowStore((s) => s.output);
  const saveStatus = useWorkflowStore((s) => s.saveStatus);

  return (
    <div className="h-screen flex flex-col grid-bg">
      <header className="px-6 py-3 border-b border-nexus-border flex items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-display text-xl font-bold text-nexus-accent glow-text">
            NEXUS-3D
          </span>
          <span className="font-mono text-xs text-nexus-muted">/ WORKFLOWS</span>
        </div>

        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Task for this workflow (e.g. Analyze https://github.com/user/repo)"
          className="flex-1 min-w-0 bg-nexus-panel border border-nexus-border text-nexus-text font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-nexus-accent/50 placeholder:text-nexus-muted/50"
        />

        <div className="flex gap-2 shrink-0">
          <button
            onClick={save}
            className="flex items-center gap-2 bg-nexus-panel border border-nexus-border text-nexus-muted px-4 py-2 rounded-lg font-mono text-xs hover:border-nexus-accent/40 hover:text-nexus-accent transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save Workflow
          </button>
          <button
            onClick={() => startRun()}
            disabled={running || !task.trim()}
            className="flex items-center gap-2 bg-nexus-accent/20 border border-nexus-accent/40 text-nexus-accent px-4 py-2 rounded-lg font-mono text-xs hover:bg-nexus-accent/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Run Workflow
              </>
            )}
          </button>
        </div>
      </header>

      {saveStatus && (
        <div className="px-6 py-1.5 bg-nexus-success/10 border-b border-nexus-success/30 font-mono text-[11px] text-nexus-success">
          {saveStatus}
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 grid-rows-[1fr_auto] gap-3 p-3 min-h-0">
        {/* Sidebar: Presets */}
        <div className="col-span-12 lg:col-span-3 row-span-2 space-y-2 overflow-y-auto">
          <span className="font-mono text-xs text-nexus-muted uppercase tracking-wider px-1">
            Workflow Templates
          </span>
          {WORKFLOW_PRESETS.map((preset, i) => {
            const Icon = PRESET_ICONS[i] ?? Search;
            return (
              <button
                key={preset.name}
                onClick={() => loadPreset(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                  selectedPreset === i
                    ? "bg-nexus-accent/10 border-nexus-accent/40 text-nexus-accent"
                    : "bg-nexus-panel border-nexus-border text-nexus-muted hover:border-nexus-accent/20"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <span className="font-mono text-xs block">{preset.name}</span>
                  <span className="text-[10px] text-nexus-muted/60">
                    {preset.nodes.map((n) => n.label).join(" → ")}
                  </span>
                </div>
              </button>
            );
          })}

          <button
            onClick={loadBlank}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-nexus-border text-nexus-muted hover:border-nexus-accent/40 hover:text-nexus-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="font-mono text-xs">New Workflow</span>
          </button>
        </div>

        {/* Editor */}
        <div className="col-span-12 lg:col-span-9 min-h-[400px]">
          <WorkflowEditor />
        </div>

        {/* Output console */}
        {(running || stepLogs.length > 0 || output) && (
          <div className="col-span-12 lg:col-span-9 h-56 bg-nexus-panel border border-nexus-border rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-1.5 border-b border-nexus-border flex items-center justify-between">
              <span className="font-mono text-xs text-nexus-muted">
                EXECUTION OUTPUT
              </span>
              {running && (
                <span className="font-mono text-[10px] text-nexus-accent animate-pulse">
                  ● RUNNING
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
              {stepLogs.map((log, i) => (
                <div key={`${log.nodeId}-${i}`}>
                  <span
                    className={
                      log.summary.startsWith("Failed:")
                        ? "text-red-400"
                        : "text-nexus-success"
                    }
                  >
                    ✓ {log.label}:
                  </span>{" "}
                  <span className="text-nexus-muted">{log.summary}</span>
                </div>
              ))}
              {output && (
                <div className="pt-2 border-t border-nexus-border/50">
                  <span className="text-nexus-warning">◆ FINAL ANSWER</span>
                  <pre className="mt-1 whitespace-pre-wrap text-nexus-text/90 leading-relaxed">
                    {output}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
