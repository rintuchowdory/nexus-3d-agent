"use client";

import { create } from "zustand";
import type { Node, Edge, NodeChange, EdgeChange, Connection } from "reactflow";
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "reactflow";
import { WORKFLOW_PRESETS, blankWorkflow, type WorkflowPreset } from "../workflow/presets";

export type NodeRunState = "idle" | "active" | "completed" | "failed";

export interface StepLog {
  nodeId: string;
  label: string;
  summary: string;
  detail?: string;
}

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedPreset: number;
  task: string;
  running: boolean;
  nodeStates: Record<string, NodeRunState>;
  stepLogs: StepLog[];
  output: string;
  saveStatus: string;

  loadPreset: (i: number) => void;
  loadBlank: () => void;
  setTask: (t: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (c: Connection) => void;
  startRun: () => Promise<void>;
  save: () => void;
}

function toNodes(preset: { nodes: WorkflowPreset["nodes"] }): Node[] {
  return preset.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: { x: n.x, y: n.y },
    data: { label: n.label },
  }));
}

function toEdges(preset: { edges: WorkflowPreset["edges"] }): Edge[] {
  return preset.edges.map((e, i) => ({
    id: `e${i}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    animated: true,
  }));
}

const SAVED_KEY = "nexus-workflow-saved";

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: toNodes(WORKFLOW_PRESETS[0]),
  edges: toEdges(WORKFLOW_PRESETS[0]),
  selectedPreset: 0,
  task: WORKFLOW_PRESETS[0].defaultTask,
  running: false,
  nodeStates: {},
  stepLogs: [],
  output: "",
  saveStatus: "",

  loadPreset: (i) => {
    const preset = WORKFLOW_PRESETS[i];
    if (!preset) return;
    set({
      selectedPreset: i,
      nodes: toNodes(preset),
      edges: toEdges(preset),
      task: preset.defaultTask,
      nodeStates: {},
      stepLogs: [],
      output: "",
      saveStatus: "",
    });
  },

  loadBlank: () =>
    set({
      selectedPreset: -1,
      nodes: toNodes(blankWorkflow()),
      edges: toEdges(blankWorkflow()),
      nodeStates: {},
      stepLogs: [],
      output: "",
      saveStatus: "",
    }),

  setTask: (t) => set({ task: t }),

  onNodesChange: (changes) =>
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),
  onEdgesChange: (changes) =>
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),
  onConnect: (c) =>
    set((s) => ({ edges: addEdge({ ...c, animated: true }, s.edges) })),

  startRun: async () => {
    const { task, nodes, running } = get();
    if (running || !task.trim()) return;

    // Execute left-to-right by canvas position.
    const ordered = [...nodes].sort((a, b) => a.position.x - b.position.x);
    const states: Record<string, NodeRunState> = {};
    for (const n of nodes) states[n.id] = "idle";
    set({
      running: true,
      nodeStates: states,
      stepLogs: [],
      output: "",
      saveStatus: "",
    });

    try {
      const res = await fetch("/api/workflow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          steps: ordered.map((n) => ({
            id: n.id,
            label: (n.data as { label?: string }).label ?? n.id,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(`Workflow API ${res.status}: ${text.slice(0, 200)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const data = line.startsWith("data: ") ? line.slice(6).trim() : null;
          if (!data || data === "[DONE]") continue;
          let ev: any;
          try {
            ev = JSON.parse(data);
          } catch {
            continue;
          }

          if (ev.type === "step_start") {
            set((s) => ({
              nodeStates: { ...s.nodeStates, [ev.nodeId]: "active" },
            }));
          } else if (ev.type === "step_result") {
            set((s) => ({
              nodeStates: { ...s.nodeStates, [ev.nodeId]: "completed" },
              stepLogs: [
                ...s.stepLogs,
                { nodeId: ev.nodeId, label: ev.label, summary: ev.summary, detail: ev.detail },
              ],
            }));
          } else if (ev.type === "step_error") {
            set((s) => ({
              nodeStates: { ...s.nodeStates, [ev.nodeId]: "failed" },
              stepLogs: [
                ...s.stepLogs,
                { nodeId: ev.nodeId, label: ev.label, summary: ev.summary },
              ],
            }));
          } else if (ev.type === "token") {
            set((s) => ({ output: s.output + (ev.content ?? "") }));
          } else if (ev.type === "complete") {
            set({ output: ev.response ?? get().output });
            done = true;
          } else if (ev.type === "error") {
            set((s) => ({
              output: s.output + `\n\n⚠️ ${ev.message}`,
            }));
            done = true;
          }
        }
      }
    } catch (err) {
      set((s) => ({
        output: s.output + `\n\n⚠️ ${(err as Error).message}`,
      }));
      // Mark any still-active nodes as failed.
      set((s) => {
        const fixed: Record<string, NodeRunState> = {};
        for (const [id, st] of Object.entries(s.nodeStates)) {
          fixed[id] = st === "active" ? "failed" : st;
        }
        return { nodeStates: fixed };
      });
    } finally {
      set({ running: false });
    }
  },

  save: () => {
    const { nodes, edges, task, selectedPreset } = get();
    const name =
      selectedPreset >= 0 ? WORKFLOW_PRESETS[selectedPreset].name : "Custom workflow";
    try {
      localStorage.setItem(
        SAVED_KEY,
        JSON.stringify({ name, task, nodes, edges, savedAt: new Date().toISOString() })
      );
      set({ saveStatus: `Saved "${name}" (${nodes.length} nodes) to this browser` });
    } catch {
      set({ saveStatus: "Save failed — localStorage unavailable" });
    }
    setTimeout(() => set((s) => (s.saveStatus === `Saved "${name}" (${nodes.length} nodes) to this browser` ? { saveStatus: "" } : s)), 4000);
  },
}));
