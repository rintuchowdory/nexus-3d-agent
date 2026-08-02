"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AgentStatus } from "../../types/agent-events";

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: "#00D9FF",
  thinking: "#FFB800",
  tool_call: "#00D9FF",
  success: "#00FF88",
  error: "#FF3366",
  waiting: "#FFB800",
};

interface AgentCoreProps {
  status: AgentStatus;
}

export function AgentCore({ status }: AgentCoreProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const color = STATUS_COLORS[status];

  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.8,
        transparent: true,
        opacity: 0.85,
      }),
    [color]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (meshRef.current) {
      // Rotation speed varies by status
      const rotSpeed =
        status === "thinking" ? 0.02 : status === "idle" ? 0.005 : 0.015;
      meshRef.current.rotation.y += rotSpeed;
      meshRef.current.rotation.x += rotSpeed * 0.3;

      // Pulsing scale for thinking/error
      const pulse =
        status === "thinking"
          ? 1 + Math.sin(t * 4) * 0.08
          : status === "error"
          ? 1 + Math.sin(t * 8) * 0.15
          : 1 + Math.sin(t * 2) * 0.03;
      meshRef.current.scale.setScalar(pulse);
    }

    if (innerRef.current) {
      innerRef.current.rotation.y -= 0.03;
      innerRef.current.rotation.z += 0.02;
    }

    if (ringRef.current) {
      const ringPulse = status === "success" ? 1.2 + Math.sin(t * 3) * 0.2 : 1;
      ringRef.current.scale.setScalar(ringPulse);
      ringRef.current.rotation.z += 0.01;
    }
  });

  return (
    <group>
      {/* Outer wireframe sphere */}
      <mesh ref={meshRef} material={coreMaterial}>
        <icosahedronGeometry args={[1.5, 1]} />
      </mesh>

      {/* Inner solid core */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color={new THREE.Color(color)}
          emissive={new THREE.Color(color)}
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Success ring */}
      {status === "success" && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.2, 0.05, 8, 64]} />
          <meshStandardMaterial
            color="#00FF88"
            emissive="#00FF88"
            emissiveIntensity={2}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}

      {/* Point lights for glow effect */}
      <pointLight position={[0, 0, 0]} color={color} intensity={3} distance={8} />
      <pointLight position={[2, 2, 2]} color={color} intensity={1.5} distance={10} />
      <pointLight position={[-2, -2, -2]} color={color} intensity={1} distance={10} />
    </group>
  );
}
