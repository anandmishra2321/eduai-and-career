"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AICore } from "./AICore";
import { StarfieldNebula } from "./StarfieldNebula";
import { CameraController, CameraWaypoint } from "./CameraController";
import { AcademicNodeScene } from "./AcademicNodeScene";
import { SkillGraphScene } from "./SkillGraphScene";
import { VoiceState } from "@/components/ui/VoiceButton";

interface EduAICanvasProps {
  scrollProgress: number; // 0.0 to 1.0
  voiceState?: VoiceState;
  isOverdrive?: boolean;
  waypoints?: CameraWaypoint[];
  onSelectSkill?: (name: string) => void;
}

export function EduAICanvas({
  scrollProgress,
  voiceState = "IDLE",
  isOverdrive = false,
  waypoints,
  onSelectSkill,
}: EduAICanvasProps) {
  // Determine scene visibility based on scroll milestones
  const showAcademic = scrollProgress > 0.1 && scrollProgress < 0.35;
  const showSkills = scrollProgress > 0.25 && scrollProgress < 0.55;

  return (
    <div className="webgl-canvas-container">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 48 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1}
      >
        <Suspense fallback={null}>
          {/* Deep Space Atmosphere */}
          <color attach="background" args={["#030712"]} />
          <fog attach="fog" args={["#030712", 8, 28]} />

          {/* Ambient Cosmic Illumination */}
          <ambientLight intensity={0.4} />

          {/* Key Directional Cyber Light */}
          <directionalLight
            position={[5, 10, 7]}
            intensity={1.2}
            color="#38BDF8"
          />

          {/* Rim Indigo Backlight */}
          <directionalLight
            position={[-5, -8, -5]}
            intensity={0.8}
            color="#6366F1"
          />

          {/* Deep Starfield & Quantum Nebulae */}
          <StarfieldNebula count={1400} speed={0.06} />

          {/* Central 3D AI Intelligence Core */}
          <AICore
            scrollProgress={scrollProgress}
            voiceState={voiceState}
            isOverdrive={isOverdrive}
          />

          {/* Domain Specific 3D Subscenes */}
          <AcademicNodeScene visible={showAcademic} opacity={1} />
          <SkillGraphScene
            visible={showSkills}
            opacity={1}
            onSelectSkill={onSelectSkill}
          />

          {/* Camera Spline Controller */}
          <CameraController
            scrollProgress={scrollProgress}
            isOverdrive={isOverdrive}
            waypoints={waypoints}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

