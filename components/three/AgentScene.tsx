"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Environment } from "@react-three/drei";
import { AgentCore } from "./AgentCore";
import { ToolNode } from "./ToolNode";
import { ConnectionBeam } from "./ConnectionBeam";
import type { ToolType, AgentStatus } from "@/types/agent-events";
import { useAgentStore } from "@/lib/store/agent-store";

const TOOLS: { type: ToolType; label: string; position: [number, number, number] }[] = [
  { type: "github", label: "GitHub", position: [4, 1.5, -1] },
  { type: "docker", label: "Docker", position: [-3.5, 2, 1] },
  { type: "terminal", label: "Terminal", position: [0, -3, 3] },
  { type: "browser", label: "Browser", position: [4.5, -1.5, 2] },
  { type: "database", label: "Database", position: [-4, -1, -2] },
  { type: "deployment", label: "Deploy", position: [2, 3.5, 1] },
  { type: "fileAnalysis", label: "Files", position: [-2.5, 3, -1] },
  { type: "webSearch", label: "Search", position: [3.5, -3, -2] },
];

export function AgentScene() {
  const status = useAgentStore((s) => s.status);
  const activeTool = useAgentStore((s) => s.activeTool);

  return (
    <Canvas
      camera={{ position: [0, 2, 10], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Background stars */}
      <Stars radius={50} depth={30} count={1500} factor={3} fade speed={1} />

      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} />

      {/* Central AI Core */}
      <AgentCore status={status} />

      {/* Tool nodes orbiting */}
      {TOOLS.map((tool) => (
        <ToolNode
          key={tool.type}
          type={tool.type}
          label={tool.label}
          position={tool.position}
          active={activeTool === tool.type}
          status={status}
        />
      ))}

      {/* Connection beams from center to each tool */}
      {TOOLS.map((tool) => (
        <ConnectionBeam
          key={`beam-${tool.type}`}
          start={[0, 0, 0]}
          end={tool.position}
          active={activeTool === tool.type || status === "thinking"}
        />
      ))}

      <OrbitControls
        enableZoom
        enablePan={false}
        minDistance={6}
        maxDistance={20}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </Canvas>
  );
}

export function AgentSceneFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-nexus-muted text-sm font-mono">
        Loading 3D scene...
      </div>
    </div>
  );
}
