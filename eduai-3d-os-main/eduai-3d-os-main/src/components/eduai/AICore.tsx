import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float, Sparkles, MeshTransmissionMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

export type CoreState = { scroll: number; energy: number; warp: number };

function Core({ state }: { state: React.MutableRefObject<CoreState> }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((s, raw) => {
    const dt = Math.min(raw, 0.05);
    const { scroll, energy, warp } = state.current;
    const g = group.current;
    if (!g) return;
    g.rotation.y += dt * (0.15 + energy * 1.5);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, s.pointer.y * 0.3 + scroll * 1.2, 3, dt);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -s.pointer.x * 0.25, 3, dt);
    const sc = 1 + scroll * 0.4 + warp * 2;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, sc, 4, dt));
    if (inner.current) inner.current.rotation.x -= dt * 0.6;
    if (ring1.current) ring1.current.rotation.z += dt * 0.4;
    if (ring2.current) ring2.current.rotation.x += dt * 0.3;
    if (light.current) light.current.intensity = 6 + energy * 30 + Math.sin(s.clock.elapsedTime * 2) * 1.5;
    s.camera.position.z = THREE.MathUtils.damp(s.camera.position.z, 6 - warp * 5, 3, dt);
  });

  return (
    <group ref={group}>
      <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.6}>
        <mesh>
          <icosahedronGeometry args={[1.35, 0]} />
          <MeshTransmissionMaterial thickness={0.6} roughness={0.08} transmission={1} ior={1.4} chromaticAberration={0.06} backside samples={4} resolution={256} color="#cfe8ff" />
        </mesh>
        <mesh ref={inner}>
          <octahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial color="#7fe3ff" emissive="#3fb8ff" emissiveIntensity={2.2} metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh ref={ring1}>
          <torusGeometry args={[2, 0.012, 16, 160]} />
          <meshStandardMaterial color="#d9e6f2" metalness={1} roughness={0.15} />
        </mesh>
        <mesh ref={ring2} rotation-x={Math.PI / 2.4}>
          <torusGeometry args={[2.4, 0.008, 16, 160]} />
          <meshStandardMaterial color="#6fd3ff" emissive="#2a8cff" emissiveIntensity={0.8} metalness={1} roughness={0.2} />
        </mesh>
        <pointLight ref={light} color="#5cc8ff" distance={8} />
      </Float>
    </group>
  );
}

export function AICoreScene({ state }: { state: React.MutableRefObject<CoreState> }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 6], fov: 45 }} gl={{ antialias: true }}>
      <color attach="background" args={["#070b16"]} />
      <fog attach="fog" args={["#070b16", 6, 18]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} color="#dbe9ff" />
      <Core state={state} />
      <Sparkles count={160} scale={[14, 9, 10]} size={1.6} speed={0.25} color="#9fdcff" opacity={0.6} />
      <Environment resolution={128}>
        <Lightformer intensity={2} position={[0, 5, -2]} scale={[10, 3, 1]} color="#cfe6ff" />
        <Lightformer intensity={1.5} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} color="#3fa6ff" />
        <Lightformer intensity={0.6} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} color="#e8c88a" />
      </Environment>
    </Canvas>
  );
}
