"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SkillNode3D {
  name: string;
  pos: [number, number, number];
  status: "mastered" | "learning" | "weak" | "required";
}

const DEFAULT_SKILLS: SkillNode3D[] = [
  { name: "Python", pos: [-2.5, 1.2, 0.4], status: "mastered" },
  { name: "Machine Learning", pos: [-1.8, 0.2, -0.2], status: "learning" },
  { name: "SQL", pos: [-3.2, 0.4, 0.8], status: "mastered" },
  { name: "Deep Learning", pos: [-1.2, 1.5, -0.6], status: "learning" },
  { name: "Statistics", pos: [-2.9, -0.8, 0.2], status: "weak" },
  { name: "Data Viz", pos: [-1.5, -0.7, 0.5], status: "learning" },
  { name: "Transformers", pos: [-0.6, 0.8, -0.8], status: "required" },
];

export function SkillGraphScene({
  visible = true,
  opacity = 1,
  onSelectSkill,
}: {
  visible?: boolean;
  opacity?: number;
  onSelectSkill?: (name: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  // Calculate connection lines between nodes
  const lineGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < DEFAULT_SKILLS.length; i++) {
      for (let j = i + 1; j < DEFAULT_SKILLS.length; j++) {
        const p1 = new THREE.Vector3(...DEFAULT_SKILLS[i].pos);
        const p2 = new THREE.Vector3(...DEFAULT_SKILLS[j].pos);
        if (p1.distanceTo(p2) < 2.0) {
          points.push(p1, p2);
        }
      }
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, []);

  if (!visible) return null;

  const colorMap = {
    mastered: "#10B981", // green
    learning: "#00F0FF", // cyan
    weak: "#F59E0B",     // gold
    required: "#A855F7", // purple
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Laser network connecting skills */}
      {/* @ts-ignore */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color="#00F0FF"
          transparent
          opacity={0.35 * opacity}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Floating 3D Skill Nodes */}
      {DEFAULT_SKILLS.map((skill) => (
        <group key={skill.name} position={skill.pos}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onSelectSkill?.(skill.name);
            }}
          >
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial
              color={colorMap[skill.status]}
              emissive={colorMap[skill.status]}
              emissiveIntensity={0.8 * opacity}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Halo ring around node */}
          <mesh>
            <ringGeometry args={[0.22, 0.25, 32]} />
            <meshBasicMaterial
              color={colorMap[skill.status]}
              transparent
              opacity={0.4 * opacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

