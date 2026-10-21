"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AcademicNodeSceneProps {
  visible?: boolean;
  opacity?: number;
}

export function AcademicNodeScene({ visible = true, opacity = 1 }: AcademicNodeSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 0.4;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.3;
    if (ring3Ref.current) ring3Ref.current.rotation.z += delta * 0.2;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={[2.2, 0.8, 0]}>
      {/* Attendance Ring (Green/Cyan) */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[1.1, 1.15, 64]} />
        <meshBasicMaterial
          color="#10B981"
          transparent
          opacity={0.7 * opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Internal Marks Ring (Cyan) */}
      <mesh ref={ring2Ref} rotation={[0.4, 0.2, 0]}>
        <ringGeometry args={[1.35, 1.4, 64]} />
        <meshBasicMaterial
          color="#00F0FF"
          transparent
          opacity={0.8 * opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Study Hours Orbit Ring (Electric Blue) */}
      <mesh ref={ring3Ref} rotation={[-0.3, 0.5, 0]}>
        <ringGeometry args={[1.6, 1.64, 64]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.6 * opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating 3D Metric Node 1 */}
      <mesh position={[1.2, 0.6, 0.3]}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00A3FF"
          emissiveIntensity={1}
          metalness={0.9}
        />
      </mesh>

      {/* Floating 3D Metric Node 2 */}
      <mesh position={[-0.9, -0.8, 0.4]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#059669"
          emissiveIntensity={1}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
}

