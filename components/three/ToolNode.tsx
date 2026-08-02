"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Octahedron, Box, Cylinder } from "@react-three/drei";
import * as THREE from "three";
import type { ToolType, AgentStatus } from "../../types/agent-events";

interface ToolNodeProps {
  type: ToolType;
  label: string;
  position: [number, number, number];
  active: boolean;
  status: AgentStatus;
}

const TOOL_LABELS: Record<ToolType, string> = {
  github: "GitHub",
  docker: "Docker",
  terminal: "Terminal",
  browser: "Browser",
  database: "DB",
  deployment: "Deploy",
  fileAnalysis: "Files",
  webSearch: "Search",
  memory: "Memory",
};

export function ToolNode({ type, label, position, active, status }: ToolNodeProps) {
  const ref = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef(new THREE.Vector3(...position));

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    // Orbital motion
    ref.current.position.x = position[0] + Math.sin(t * 0.3 + position[0]) * 0.3;
    ref.current.position.y = position[1] + Math.cos(t * 0.2 + position[1]) * 0.2;
    ref.current.position.z = position[2] + Math.sin(t * 0.25 + position[2]) * 0.3;

    // When active, move closer to center
    const targetScale = active ? 1.4 : 1;
    if (meshRef.current) {
      const currentScale = meshRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.1;
      meshRef.current.scale.setScalar(newScale);
      meshRef.current.rotation.y += active ? 0.05 : 0.01;
    }
  });

  const color = active ? "#00D9FF" : "#3A4458";

  return (
    <group ref={ref} position={position}>
      <mesh ref={meshRef}>
        {type === "docker" ? (
          <boxGeometry args={[0.5, 0.5, 0.5]} />
        ) : type === "database" ? (
          <cylinderGeometry args={[0.35, 0.35, 0.6, 16]} />
        ) : type === "deployment" ? (
          <sphereGeometry args={[0.4, 16, 16]} />
        ) : (
          <octahedronGeometry args={[0.4, 0]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1.5 : 0.3}
          roughness={0.4}
          metalness={0.7}
          transparent
          opacity={active ? 0.9 : 0.7}
        />
      </mesh>

      {/* Glow when active */}
      {active && (
        <pointLight
          color={color}
          intensity={2}
          distance={4}
        />
      )}

      {/* Label */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.28}
        color={active ? "#00D9FF" : "#6B7790"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#05070D"
      >
        {TOOL_LABELS[type] || label}
      </Text>
    </group>
  );
}
