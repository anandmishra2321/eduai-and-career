import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, Lightformer, OrbitControls, Sparkles, Line } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { MODULES } from "@/lib/modules";

function Node({ pos, label, onClick }: { pos: THREE.Vector3; label: string; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.5;
    const s = THREE.MathUtils.damp(ref.current.scale.x, hover ? 1.5 : 1, 8, dt);
    ref.current.scale.setScalar(s);
  });
  return (
    <group position={pos}>
      <mesh ref={ref} onClick={onClick} onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }} onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={hover ? "#9fe8ff" : "#cfdceb"} emissive="#2a9dff" emissiveIntensity={hover ? 1.6 : 0.4} metalness={0.9} roughness={0.2} />
      </mesh>
      <Html center distanceFactor={9} position={[0, -0.6, 0]} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap font-mono text-[11px] tracking-widest text-foreground/80">{label.toUpperCase()}</div>
      </Html>
    </group>
  );
}

export function WorldScene({ onSelect }: { onSelect: (slug: string) => void }) {
  const positions = useMemo(() => MODULES.map((_, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / MODULES.length);
    const th = Math.PI * (1 + Math.sqrt(5)) * i;
    return new THREE.Vector3(Math.cos(th) * Math.sin(phi), Math.cos(phi) * 0.7, Math.sin(th) * Math.sin(phi)).multiplyScalar(4);
  }), []);
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 1.5, 9], fov: 50 }}>
      <color attach="background" args={["#070b16"]} />
      <fog attach="fog" args={["#070b16", 8, 20]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 4]} intensity={1} />
      <mesh>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color="#7fe3ff" emissive="#2a8cff" emissiveIntensity={1.4} wireframe />
      </mesh>
      {MODULES.map((mod, i) => { const p = positions[i]!; return (
        <group key={mod.slug}>
          <Line points={[[0, 0, 0], p.toArray()]} color="#3a8fd0" lineWidth={0.6} transparent opacity={0.35} />
          <Node pos={p} label={mod.name} onClick={() => onSelect(mod.slug)} />
        </group>
      ); })}
      <Sparkles count={200} scale={18} size={1.4} speed={0.2} color="#9fdcff" opacity={0.5} />
      <OrbitControls enablePan={false} minDistance={5} maxDistance={14} autoRotate autoRotateSpeed={0.4} enableDamping />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} color="#cfe6ff" />
        <Lightformer intensity={1} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} color="#3fa6ff" />
      </Environment>
    </Canvas>
  );
}
