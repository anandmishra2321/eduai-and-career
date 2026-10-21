"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { VoiceState } from "@/components/ui/VoiceButton";

interface AICoreProps {
  scrollProgress?: number; // 0.0 to 1.0
  voiceState?: VoiceState;
  isOverdrive?: boolean;   // Hyperdrive triggered during login
}

export function AICore({
  scrollProgress = 0,
  voiceState = "IDLE",
  isOverdrive = false,
}: AICoreProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Determine speed multipliers
    let speedMultiplier = 1.0;
    if (voiceState === "LISTENING") speedMultiplier = 2.2;
    if (voiceState === "PROCESSING") speedMultiplier = 4.0;
    if (voiceState === "RESPONDING") speedMultiplier = 2.8;
    if (isOverdrive) speedMultiplier = 12.0;

    // Mouse parallax tilt
    if (groupRef.current) {
      const mouseX = state.pointer.x * 0.4;
      const mouseY = state.pointer.y * 0.3;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouseX + scrollProgress * Math.PI * 1.5,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -mouseY,
        0.05
      );
    }

    // Inner core pulsation and rotation
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.y += delta * 0.8 * speedMultiplier;
      innerCoreRef.current.rotation.z += delta * 0.4 * speedMultiplier;

      const pulse = 1.0 + Math.sin(time * (voiceState === "LISTENING" ? 6 : 2.5)) * 0.08;
      const overdriveScale = isOverdrive ? 1.4 : 1.0;
      innerCoreRef.current.scale.setScalar(pulse * overdriveScale);
    }

    // Concentric Gyro Rings rotation
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.6 * speedMultiplier;
      ring1Ref.current.rotation.y += delta * 0.3 * speedMultiplier;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.5 * speedMultiplier;
      ring2Ref.current.rotation.z += delta * 0.7 * speedMultiplier;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += delta * 0.4 * speedMultiplier;
      ring3Ref.current.rotation.x += delta * 0.5 * speedMultiplier;
    }

    // Light pulsation
    if (lightRef.current) {
      const targetIntensity = isOverdrive
        ? 15.0
        : voiceState === "LISTENING"
        ? 6.0
        : 3.5 + Math.sin(time * 3) * 0.8;
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        targetIntensity,
        0.1
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Central Radiating Energy Point Light */}
      <pointLight
        ref={lightRef}
        color={isOverdrive ? "#FFFFFF" : "#00F0FF"}
        intensity={3.5}
        distance={12}
        decay={2}
      />

      {/* Inner Crystalline Geometric Core */}
      <mesh ref={innerCoreRef}>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshPhysicalMaterial
          color={isOverdrive ? "#FFFFFF" : "#00F0FF"}
          emissive={isOverdrive ? "#38BDF8" : "#00A3FF"}
          emissiveIntensity={isOverdrive ? 3.5 : 1.2}
          roughness={0.15}
          metalness={0.8}
          transmission={0.6}
          thickness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe Holographic Shroud */}
      <mesh>
        <dodecahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial
          color="#00F0FF"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Primary Gyro Ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.45, 0.025, 16, 100]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#00F0FF"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Secondary Gyro Ring */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.75, 0.02, 16, 100]} />
        <meshStandardMaterial
          color="#60A5FA"
          emissive="#2563EB"
          emissiveIntensity={0.6}
          metalness={0.95}
          roughness={0.15}
        />
      </mesh>

      {/* Tertiary Outer Gyro Ring with Tick Marks */}
      <mesh ref={ring3Ref}>
        <torusGeometry args={[2.05, 0.015, 16, 100]} />
        <meshStandardMaterial
          color="#818CF8"
          emissive="#4F46E5"
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

