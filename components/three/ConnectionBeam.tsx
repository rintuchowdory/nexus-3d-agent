"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ConnectionBeamProps {
  start: [number, number, number];
  end: [number, number, number];
  active: boolean;
}

export function ConnectionBeam({ start, end, active }: ConnectionBeamProps) {
  const beamRef = useRef<THREE.Mesh>(null);
  const particleRef = useRef<THREE.Mesh>(null);

  const direction = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const dir = e.clone().sub(s);
    const length = dir.length();
    const mid = s.clone().add(e).multiplyScalar(0.5);
    return { mid, length, dir: dir.normalize(), s, e };
  }, [start, end]);

  useFrame((state) => {
    if (beamRef.current) {
      const t = state.clock.elapsedTime;
      const pulse = active ? 0.5 + Math.sin(t * 6) * 0.5 : 0.15;
      (beamRef.current.material as THREE.Material).opacity = pulse;
    }

    // Animate particle along the beam when active
    if (particleRef.current && active) {
      const t = state.clock.elapsedTime;
      const progress = (t % 2) / 2; // 0 to 1 every 2 seconds
      const pos = direction.s.clone().lerp(direction.e, progress);
      particleRef.current.position.copy(pos);
      particleRef.current.visible = true;
    } else if (particleRef.current) {
      particleRef.current.visible = false;
    }
  });

  // Calculate position and rotation
  const position: [number, number, number] = direction.mid.toArray();
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    q.setFromUnitVectors(up, direction.dir);
    return q;
  }, [direction.dir]);

  return (
    <group>
      {/* The beam itself */}
      <mesh
        ref={beamRef}
        position={position}
        quaternion={quaternion}
      >
        <cylinderGeometry args={[0.02, 0.02, direction.length, 8]} />
        <meshBasicMaterial
          color={active ? "#00D9FF" : "#1A2030"}
          transparent
          opacity={active ? 0.8 : 0.2}
        />
      </mesh>

      {/* Traveling particle */}
      <mesh ref={particleRef} visible={false}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#00D9FF" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
