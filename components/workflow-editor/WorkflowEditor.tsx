"use client";

import { useState, useCallback, useRef, DragEvent } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  tool: ToolNode as any,
  input: InputNode,
  output: OutputNode,
};

const initialNodes: Node[] = [
  { id: "input", type: "input", position: { x: 100, y: 50 }, data: { label: "User Input" } },
  { id: "router", type: "agent", position: { x: 300, y: 50 }, data: { label: "Task Router" } },
  { id: "github", type: "tool", position: { x: 500, y: 0 }, data: { label: "GitHub Agent" } },
  { id: "research", type: "tool", position: { x: 500, y: 120 }, data: { label: "Web Research" } },
  { id: "verifier", type: "agent", position: { x: 700, y: 60 }, data: { label: "Verification Agent" } },
  { id: "output", type: "output", position: { x: 900, y: 60 }, data: { label: "Final Answer" } },
];

const initialEdges: Edge[] = [
  { id: "e-input-router", source: "input", target: "router", animated: true },
  { id: "e-router-github", source: "router", target: "github", animated: true },
  { id: "e-router-research", source: "router", target: "research", animated: true },
  { id: "e-github-verifier", source: "github", target: "verifier", animated: true },
  { id: "e-research-verifier", source: "research", target: "verifier", animated: true },
  { id: "e-verifier-output", source: "verifier", target: "output", animated: true },
];

export function WorkflowEditor() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const rfRef = useRef<HTMLDivElement>(null);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    []
  );

  return (
    <div className="w-full h-full bg-nexus-panel border border-nexus-border rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-nexus-border">
        <span className="font-mono text-sm text-nexus-text">Workflow Editor</span>
      </div>
      <div style={{ height: "calc(100% - 40px)" }}>
        <ReactFlow
          ref={rfRef as any}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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

function AgentNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 rounded-lg bg-nexus-panel border border-nexus-accent/40 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-nexus-accent animate-pulse" />
        <span className="font-mono text-xs text-nexus-text">{data.label}</span>
      </div>
    </div>
  );
}

function ToolNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-3 py-1.5 rounded-md bg-nexus-border/40 border border-nexus-border">
      <span className="font-mono text-[10px] text-nexus-muted">{data.label}</span>
    </div>
  );
}

function InputNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 rounded-lg bg-nexus-success/10 border border-nexus-success/40">
      <span className="font-mono text-xs text-nexus-success">{data.label}</span>
    </div>
  );
}

function OutputNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 rounded-lg bg-nexus-warning/10 border border-nexus-warning/40">
      <span className="font-mono text-xs text-nexus-warning">{data.label}</span>
    </div>
  );
}
