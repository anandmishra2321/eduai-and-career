"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface LearningLabProps {
  modelPath?: string;
  topic?: string;
  onComponentSelect?: (component: string) => void;
  reducedMotion?: boolean;
}

// 3D Model Component with Interactive Parts
function InteractiveModel({
  topic = "Human Heart",
  reducedMotion = false,
  onComponentSelect,
}: {
  topic?: string;
  reducedMotion?: boolean;
  onComponentSelect?: (component: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);

  useFrame((state) => {
    if (groupRef.current) {
      if (!reducedMotion) {
        const time = state.clock.getElapsedTime();
        groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      }
    }
  });

  // The geometry is illustrative demo content rather than an anatomical model.
  const components = [
    {
      id: "left-ventricle",
      name: "Left Ventricle",
      description: "Pumps oxygenated blood to the body through the aorta",
      position: [0.3, 0, 0] as [number, number, number],
      color: 0xff6b6b,
    },
    {
      id: "right-ventricle",
      name: "Right Ventricle",
      description: "Pumps deoxygenated blood to the lungs",
      position: [-0.3, 0, 0] as [number, number, number],
      color: 0xff8787,
    },
    {
      id: "left-atrium",
      name: "Left Atrium",
      description: "Receives oxygenated blood from the lungs",
      position: [0.3, 0.4, 0] as [number, number, number],
      color: 0xffa8a8,
    },
    {
      id: "right-atrium",
      name: "Right Atrium",
      description: "Receives deoxygenated blood from the body",
      position: [-0.3, 0.4, 0] as [number, number, number],
      color: 0xffc9c9,
    },
    {
      id: "aorta",
      name: "Aorta",
      description: "Main artery carrying oxygenated blood from the heart",
      position: [0.5, 0.6, 0] as [number, number, number],
      color: 0xff4757,
    },
  ];

  return (
    <group ref={groupRef}>
      {/* Main Heart Shape */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#ff6b6b" transparent opacity={0.3} />
      </mesh>

      {/* Interactive Components */}
      {components.map((component) => (
        <mesh
          key={component.id}
          position={component.position}
          onClick={() => {
            setSelectedPart(component.id);
            onComponentSelect?.(component.name);
          }}
          onPointerOver={() => setHoveredPart(component.id)}
          onPointerOut={() => setHoveredPart(null)}
          scale={
            selectedPart === component.id
              ? 1.2
              : hoveredPart === component.id
              ? 1.1
              : 1
          }
        >
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial
            color={component.color}
            emissive={selectedPart === component.id ? component.color : 0x000000}
            emissiveIntensity={selectedPart === component.id ? 0.5 : 0}
          />
        </mesh>
      ))}

      {/* Labels for selected component */}
      {selectedPart && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500/40 rounded-xl p-4 max-w-xs">
            <div className="text-white font-bold mb-1">
              {components.find((c) => c.id === selectedPart)?.name}
            </div>
            <div className="text-slate-300 text-sm">
              {components.find((c) => c.id === selectedPart)?.description}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Main Learning Lab Component
export function LearningLab({ modelPath, topic = "Human Heart", onComponentSelect, reducedMotion = false }: LearningLabProps) {
  const [learningMode, setLearningMode] = useState<"explore" | "quiz" | "explain">("explore");
  const [quizQuestion, setQuizQuestion] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState("");

  const quizData = [
    {
      question: "Which chamber pumps oxygenated blood to the body?",
      answer: "Left Ventricle",
      options: ["Right Atrium", "Left Ventricle", "Right Ventricle", "Left Atrium"],
    },
    {
      question: "What is the main artery of the heart?",
      answer: "Aorta",
      options: ["Pulmonary Artery", "Aorta", "Vena Cava", "Coronary Artery"],
    },
  ];

  void modelPath;

  return (
    <div className="relative w-full h-full">
      {/* Learning Mode Selector */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {(["explore", "quiz", "explain"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setLearningMode(mode)}
            className={`px-4 py-2 rounded-xl border text-sm font-mono transition-all ${
              learningMode === mode
                ? "bg-cyan-950/60 border-cyan-400/60 text-cyan-300"
                : "bg-black/40 border-cyan-500/20 text-slate-400 hover:border-cyan-400/40"
            }`}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Topic Title */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/80 backdrop-blur-md border border-cyan-500/40 rounded-xl px-4 py-2">
          <span className="text-cyan-200 font-mono text-sm">{topic}</span>
        </div>
      </div>

      {/* 3D Canvas Content */}
      <div className="w-full h-full">
        <Canvas
          dpr={[1, 1.5]}
          frameloop={reducedMotion ? "demand" : "always"}
          camera={{ position: [0, 0, 3.5], fov: 50 }}
        >
          <ambientLight intensity={1.5} />
          <pointLight position={[3, 4, 5]} intensity={30} />
          <InteractiveModel topic={topic} reducedMotion={reducedMotion} onComponentSelect={onComponentSelect} />
          <OrbitControls enableDamping={!reducedMotion} />
        </Canvas>
      </div>

      {/* Quiz Mode Overlay */}
      {learningMode === "quiz" && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg">
          <div className="bg-black/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-6">
            <div className="text-cyan-400 font-mono text-xs mb-2">DEMO QUESTION {quizQuestion + 1}/{quizData.length}</div>
            <div className="text-white font-semibold mb-4">{quizData[quizQuestion].question}</div>
            <p role="status" aria-live="polite" className="mb-3 min-h-5 text-sm text-cyan-200">{quizFeedback}</p>
            <div className="grid grid-cols-2 gap-2">
              {quizData[quizQuestion].options.map((option, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (option === quizData[quizQuestion].answer) {
                      setQuizFeedback("Correct.");
                      if (quizQuestion < quizData.length - 1) {
                        setQuizQuestion((question) => question + 1);
                      } else {
                        setQuizQuestion(0);
                        setLearningMode("explore");
                      }
                    } else {
                      setQuizFeedback("Not quite. Review the component labels and try again.");
                    }
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 border border-cyan-500/30 text-slate-300 hover:bg-cyan-950/40 hover:border-cyan-400/60 transition-all text-sm"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Explain Mode Overlay */}
      {learningMode === "explain" && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-lg">
          <div className="bg-black/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-6">
            <div className="text-cyan-400 font-mono text-xs mb-2">PRESET EXPLANATION · DEMO</div>
            <div className="text-white text-sm leading-relaxed">
              The human heart is a muscular organ that pumps blood through the circulatory system.
              It has four chambers: the right atrium, right ventricle, left atrium, and left ventricle.
              Click on any component to learn more about its function.
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {learningMode === "explore" && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500/40 rounded-xl px-4 py-2">
            <span className="text-slate-300 text-sm">Click on components to explore • Drag to rotate</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper for React Three Fiber Canvas
export function LearningLabCanvas({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-cyan-500/30">
      <LearningLab topic="Human Heart · Illustrative Demo" reducedMotion={reducedMotion} />
    </div>
  );
}
