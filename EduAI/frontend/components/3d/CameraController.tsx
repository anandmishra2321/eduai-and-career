"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface CameraWaypoint {
  progress: number;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export const DEFAULT_CAMERA_PATH: CameraWaypoint[] = [
  // 0. Intro / Boot
  {
    progress: 0.0,
    position: [0, 0, 7.5],
    target: [0, 0, 0],
    fov: 48,
  },
  // 1. Academic Intelligence
  {
    progress: 0.18,
    position: [2.8, 1.0, 5.8],
    target: [0, 0, 0],
    fov: 45,
  },
  // 2. Skill Graph Constellation
  {
    progress: 0.36,
    position: [-3.2, 1.4, 5.2],
    target: [-0.5, 0, 0],
    fov: 46,
  },
  // 3. Career Trajectory Arc
  {
    progress: 0.54,
    position: [0, 3.2, 6.2],
    target: [0, 0, -1],
    fov: 44,
  },
  // 4. Learning & Study Studio
  {
    progress: 0.72,
    position: [2.2, -0.8, 4.8],
    target: [0, -0.2, 0],
    fov: 45,
  },
  // 5. Cinematic Login Portal
  {
    progress: 0.90,
    position: [0, 0, 4.2],
    target: [0, 0, 0],
    fov: 42,
  },
  // 6. Enter EduAI Portal Lock
  {
    progress: 1.0,
    position: [0, 0, 3.6],
    target: [0, 0, 0],
    fov: 40,
  },
];

interface CameraControllerProps {
  scrollProgress: number; // 0.0 to 1.0
  isOverdrive?: boolean;
  waypoints?: CameraWaypoint[];
}

export function CameraController({
  scrollProgress,
  isOverdrive = false,
  waypoints = DEFAULT_CAMERA_PATH,
}: CameraControllerProps) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const currentPos = useRef(new THREE.Vector3(0, 0, 7.5));

  // Find surrounding waypoints and interpolate
  const interpolatedState = useMemo(() => {
    const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

    // Find the two surrounding waypoints
    let idx = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (
        clampedProgress >= waypoints[i].progress &&
        clampedProgress <= waypoints[i + 1].progress
      ) {
        idx = i;
        break;
      }
    }

    const p1 = waypoints[idx];
    const p2 = waypoints[Math.min(idx + 1, waypoints.length - 1)];

    const span = p2.progress - p1.progress || 1;
    const localT = (clampedProgress - p1.progress) / span;
    const smoothT = THREE.MathUtils.smoothstep(localT, 0, 1);

    const pos = new THREE.Vector3(
      THREE.MathUtils.lerp(p1.position[0], p2.position[0], smoothT),
      THREE.MathUtils.lerp(p1.position[1], p2.position[1], smoothT),
      THREE.MathUtils.lerp(p1.position[2], p2.position[2], smoothT)
    );

    const target = new THREE.Vector3(
      THREE.MathUtils.lerp(p1.target[0], p2.target[0], smoothT),
      THREE.MathUtils.lerp(p1.target[1], p2.target[1], smoothT),
      THREE.MathUtils.lerp(p1.target[2], p2.target[2], smoothT)
    );

    const fov = THREE.MathUtils.lerp(p1.fov, p2.fov, smoothT);

    return { pos, target, fov };
  }, [scrollProgress, waypoints]);

  useFrame((_, delta) => {
    if (isOverdrive) {
      // Hyperdrive transition: dolly camera directly forward into the core!
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, -1.5, delta * 3.5);
      camera.lookAt(0, 0, -5);
      return;
    }

    // Smooth exponential damping toward calculated waypoint
    currentPos.current.lerp(interpolatedState.pos, 0.08);
    currentTarget.current.lerp(interpolatedState.target, 0.08);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);

    if ((camera as THREE.PerspectiveCamera).fov) {
      const pCam = camera as THREE.PerspectiveCamera;
      pCam.fov = THREE.MathUtils.lerp(pCam.fov, interpolatedState.fov, 0.08);
      pCam.updateProjectionMatrix();
    }
  });

  return null;
}

