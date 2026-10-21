"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface StarfieldNebulaProps {
  count?: number;
  speed?: number;
}

export function StarfieldNebula({ count = 1200, speed = 0.05 }: StarfieldNebulaProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate particle coordinates and colors (cyan, deep blue, crisp white)
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cyan = new THREE.Color("#00F0FF");
    const blue = new THREE.Color("#3B82F6");
    const white = new THREE.Color("#FFFFFF");
    const indigo = new THREE.Color("#6366F1");

    for (let i = 0; i < count; i++) {
      // Cylindrical / spherical cosmic field distribution
      const r = 5 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pos[i * 3] = r * Math.cos(phi) * Math.sin(theta);
      pos[i * 3 + 1] = r * Math.sin(phi);
      pos[i * 3 + 2] = r * Math.cos(phi) * Math.cos(theta);

      // Random color assignment
      const rand = Math.random();
      const chosen = rand < 0.45 ? cyan : rand < 0.75 ? blue : rand < 0.9 ? indigo : white;
      col[i * 3] = chosen.r;
      col[i * 3 + 1] = chosen.g;
      col[i * 3 + 2] = chosen.b;
    }

    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * speed * 0.2;
      pointsRef.current.rotation.x += delta * speed * 0.08;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
