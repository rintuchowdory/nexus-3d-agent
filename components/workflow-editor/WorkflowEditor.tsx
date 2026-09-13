"use client";

import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { useWorkflowStore, type NodeRunState } from "../../lib/store/workflow-store";

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  input: InputNode,
  output: OutputNode,
};

export function WorkflowEditor() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);

  const handleNodesChange = useCallback(
    (changes: any) => onNodesChange(changes),
    [onNodesChange]
  );
  const handleEdgesChange = useCallback(
    (changes: any) => onEdgesChange(changes),
    [onEdgesChange]
  );
  const handleConnect = useCallback(
    (connection: any) => onConnect(connection),
    [onConnect]
  );

  return (
    <div className="w-full h-full bg-nexus-panel border border-nexus-border rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-nexus-border flex items-center justify-between">
        <span className="font-mono text-sm text-nexus-text">Workflow Editor</span>
        <span className="font-mono text-[10px] text-nexus-muted">
          drag nodes · connect edges · run executes left-to-right
        </span>
      </div>
      <div style={{ height: "calc(100% - 40px)" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            style: { stroke: "#00D9FF", strokeWidth: 2 },
            animated: true,
          }}
        >
          <Background color="#1A2030" gap={20} />
          <Controls
            style={{
              backgroundColor: "#0B0F1A",
              borderColor: "#1A2030",
            }}
          />
          <MiniMap
            nodeColor="#00D9FF"
            maskColor="rgba(5, 7, 13, 0.7)"
            style={{
              backgroundColor: "#0B0F1A",
              border: "1px solid #1A2030",
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

function useNodeStatus(id: string): NodeRunState {
  return useWorkflowStore((s) => s.nodeStates[id] ?? "idle");
}

const statusRing: Record<NodeRunState, string> = {
  idle: "",
  active: "ring-2 ring-nexus-accent shadow-[0_0_18px_rgba(0,217,255,0.45)]",
  completed: "ring-2 ring-nexus-success/70",
  failed: "ring-2 ring-red-500/70",
};

const statusDot: Record<NodeRunState, string> = {
  idle: "bg-nexus-muted",
  active: "bg-nexus-accent animate-pulse",
  completed: "bg-nexus-success",
  failed: "bg-red-500",
};

function AgentNode({ id, data }: { id: string; data: { label: string } }) {
  const status = useNodeStatus(id);
  return (
    <div
      className={`px-4 py-2 rounded-lg bg-nexus-panel border border-nexus-accent/40 shadow-lg transition-all ${statusRing[status]}`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statusDot[status]}`} />
        <span className="font-mono text-xs text-nexus-text">{data.label}</span>
      </div>
    </div>
  );
}

function ToolNode({ id, data }: { id: string; data: { label: string } }) {
  const status = useNodeStatus(id);
  return (
    <div
      className={`px-3 py-1.5 rounded-md bg-nexus-border/40 border border-nexus-border transition-all ${statusRing[status]}`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
        <span className="font-mono text-[10px] text-nexus-muted">{data.label}</span>
      </div>
    </div>
  );
}

function InputNode({ id, data }: { id: string; data: { label: string } }) {
  const status = useNodeStatus(id);
  return (
    <div
      className={`px-4 py-2 rounded-lg bg-nexus-success/10 border border-nexus-success/40 transition-all ${statusRing[status]}`}
    >
      <span className="font-mono text-xs text-nexus-success">{data.label}</span>
    </div>
  );
}

function OutputNode({ id, data }: { id: string; data: { label: string } }) {
  const status = useNodeStatus(id);
  return (
    <div
      className={`px-4 py-2 rounded-lg bg-nexus-warning/10 border border-nexus-warning/40 transition-all ${statusRing[status]}`}
    >
      <span className="font-mono text-xs text-nexus-warning">{data.label}</span>
    </div>
  );
}
