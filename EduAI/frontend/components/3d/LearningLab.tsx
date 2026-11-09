"use client";

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface LearningLabProps {
  topic?: string;
  onComponentSelect?: (component: string) => void;
  reducedMotion?: boolean;
}

type LabMode = "explore" | "practice" | "learn";
type HeartPart = {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  color: number;
};

const heartParts: HeartPart[] = [
  {
    id: "right-atrium",
    name: "Right Atrium",
    description: "Receives oxygen-poor blood returning from the body and sends it to the right ventricle.",
    position: [-0.38, 0.42, 0.18],
    color: 0x60a5fa,
  },
  {
    id: "left-atrium",
    name: "Left Atrium",
    description: "Receives oxygen-rich blood from the lungs and sends it to the left ventricle.",
    position: [0.38, 0.42, 0.18],
    color: 0xfda4af,
  },
  {
    id: "right-ventricle",
    name: "Right Ventricle",
    description: "Pumps oxygen-poor blood toward the lungs to pick up oxygen.",
    position: [-0.32, -0.2, 0.22],
    color: 0x3b82f6,
  },
  {
    id: "left-ventricle",
    name: "Left Ventricle",
    description: "Pumps oxygen-rich blood into the aorta and out to the body.",
    position: [0.32, -0.2, 0.22],
    color: 0xef4444,
  },
  {
    id: "aorta",
    name: "Aorta",
    description: "The largest artery carries oxygen-rich blood from the left ventricle to the body.",
    position: [0.12, 0.78, 0.18],
    color: 0xf97316,
  },
];

const bloodFlowSteps: Array<{ partId: string | null; title: string; description: string }> = [
  {
    partId: "right-atrium",
    title: "1 · Receive",
    description: "Oxygen-poor blood returning from the body enters the right atrium.",
  },
  {
    partId: "right-ventricle",
    title: "2 · Pump to the lungs",
    description: "The right ventricle pumps this blood toward the lungs.",
  },
  {
    partId: null,
    title: "3 · Pick up oxygen",
    description: "At the lungs, blood releases carbon dioxide and picks up oxygen. The lungs are outside this heart illustration.",
  },
  {
    partId: "left-atrium",
    title: "4 · Return from the lungs",
    description: "Oxygen-rich blood returns from the lungs and enters the left atrium.",
  },
  {
    partId: "left-ventricle",
    title: "5 · Pump to the body",
    description: "The left ventricle pushes oxygen-rich blood out of the heart.",
  },
  {
    partId: "aorta",
    title: "6 · Travel through the aorta",
    description: "The aorta carries oxygen-rich blood from the heart to the rest of the body.",
  },
];

function InteractiveModel({
  reducedMotion,
  selectedPartId,
  onSelectPart,
}: {
  reducedMotion: boolean;
  selectedPartId: string;
  onSelectPart: (part: HeartPart) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const heartGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.92);
    shape.bezierCurveTo(-0.15, -0.55, -1.02, 0.18, -0.84, 0.72);
    shape.bezierCurveTo(-0.68, 1.12, -0.12, 1.08, 0, 0.55);
    shape.bezierCurveTo(0.12, 1.08, 0.68, 1.12, 0.84, 0.72);
    shape.bezierCurveTo(1.02, 0.18, 0.15, -0.55, 0, -0.92);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.04,
    });
  }, []);

  useFrame((state) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.25) * 0.14;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.04, 0]}>
      <mesh geometry={heartGeometry} position={[0, 0, -0.22]}>
        <meshStandardMaterial color="#b4233b" roughness={0.45} metalness={0.08} />
      </mesh>
      {heartParts.map((part) => {
        const selected = selectedPartId === part.id;
        return (
          <mesh
            key={part.id}
            position={part.position}
            scale={selected ? 1.18 : 1}
            onClick={() => onSelectPart(part)}
          >
            <sphereGeometry args={[0.19, 24, 24]} />
            <meshStandardMaterial
              color={part.color}
              emissive={part.color}
              emissiveIntensity={selected ? 0.45 : 0.12}
              roughness={0.32}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function practiceOptions(correct: HeartPart, questionIndex: number): string[] {
  const distractors = heartParts.filter((part) => part.id !== correct.id).map((part) => part.name);
  const options = distractors.slice(0, 3);
  options.splice(questionIndex % 4, 0, correct.name);
  return options;
}

function LearningLab({
  topic = "Human Heart",
  onComponentSelect,
  reducedMotion = false,
}: LearningLabProps) {
  const [mode, setMode] = useState<LabMode>("explore");
  const [selectedPartId, setSelectedPartId] = useState(heartParts[0].id);
  const [viewRevision, setViewRevision] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<"correct" | "incorrect" | null>(null);
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [flowStepIndex, setFlowStepIndex] = useState(0);
  const [flowFinished, setFlowFinished] = useState(false);

  const selectedPart = heartParts.find((part) => part.id === selectedPartId) ?? heartParts[0];
  const selectedIndex = heartParts.findIndex((part) => part.id === selectedPart.id);
  const isCorrectAnswer = answerState === "correct";
  const flowStep = bloodFlowSteps[flowStepIndex];

  const selectPart = (part: HeartPart) => {
    setSelectedPartId(part.id);
    onComponentSelect?.(part.name);
  };

  const selectMode = (nextMode: LabMode) => {
    setMode(nextMode);
    if (nextMode === "practice") {
      setQuestionIndex(0);
      setScore(0);
      setAnswerState(null);
      setPracticeFinished(false);
    }
    if (nextMode === "learn") {
      setFlowStepIndex(0);
      setFlowFinished(false);
      const firstPart = heartParts.find((part) => part.id === bloodFlowSteps[0].partId);
      if (firstPart) selectPart(firstPart);
    }
  };

  const answerQuestion = (option: string) => {
    if (answerState || practiceFinished) return;
    const correct = option === heartParts[questionIndex].name;
    setAnswerState(correct ? "correct" : "incorrect");
    if (correct) setScore((current) => current + 1);
    selectPart(heartParts[questionIndex]);
  };

  const advanceQuestion = () => {
    if (questionIndex === heartParts.length - 1) {
      setPracticeFinished(true);
      return;
    }
    setQuestionIndex((current) => current + 1);
    setAnswerState(null);
  };

  const startPracticeAgain = () => {
    setQuestionIndex(0);
    setScore(0);
    setAnswerState(null);
    setPracticeFinished(false);
  };

  const advanceFlow = (direction: -1 | 1) => {
    const nextIndex = flowStepIndex + direction;
    if (nextIndex < 0) return;
    if (nextIndex >= bloodFlowSteps.length) {
      setFlowFinished(true);
      return;
    }
    setFlowFinished(false);
    setFlowStepIndex(nextIndex);
    const partId = bloodFlowSteps[nextIndex].partId;
    const part = heartParts.find((item) => item.id === partId);
    if (part) selectPart(part);
  };

  const restartFlow = () => {
    setFlowFinished(false);
    setFlowStepIndex(0);
    const firstPart = heartParts.find((part) => part.id === bloodFlowSteps[0].partId);
    if (firstPart) selectPart(firstPart);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="relative h-[560px] overflow-hidden rounded-2xl border border-cyan-500/25 bg-slate-950/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(8,145,178,0.16),transparent_58%)]" />
        <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 rounded-xl border border-white/10 bg-black/55 p-1 backdrop-blur">
            {([
              ["explore", "Explore"],
              ["practice", "Practice"],
              ["learn", "Learn"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => selectMode(id)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  mode === id ? "bg-cyan-400/15 text-cyan-200" : "text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="rounded-lg border border-white/10 bg-black/55 px-3 py-2 text-xs text-cyan-100 backdrop-blur">
            {topic} · illustrative model
          </span>
        </div>

        <Canvas
          dpr={[1, 1.5]}
          frameloop={reducedMotion ? "demand" : "always"}
          camera={{ position: [0, 0.05, 3.8], fov: 48 }}
        >
          <ambientLight intensity={1.2} />
          <pointLight position={[3, 4, 5]} intensity={22} color="#a5f3fc" />
          <pointLight position={[-3, 1, 2]} intensity={8} color="#fb7185" />
          <InteractiveModel
            reducedMotion={reducedMotion}
            selectedPartId={selectedPart.id}
            onSelectPart={selectPart}
          />
          <OrbitControls
            key={viewRevision}
            enableDamping={!reducedMotion}
            minDistance={2.3}
            maxDistance={5.5}
          />
        </Canvas>

        {mode === "practice" && (
          <div className="absolute bottom-3 left-3 right-3 z-10 mx-auto max-w-xl rounded-2xl border border-cyan-500/30 bg-slate-950/95 p-4 shadow-xl backdrop-blur">
            {practiceFinished ? (
              <div className="text-center">
                <p className="text-xs font-mono uppercase tracking-wider text-cyan-300">Practice complete</p>
                <p className="mt-1 text-lg font-semibold text-white">Score: {score} / {heartParts.length}</p>
                <button
                  type="button"
                  onClick={startPracticeAgain}
                  className="mt-3 rounded-lg border border-cyan-400/40 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-400/10"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Question {questionIndex + 1} of {heartParts.length}</span>
                  <span>Score {score}</span>
                </div>
                <p className="text-sm font-medium text-white">
                  Which part {heartParts[questionIndex].description.charAt(0).toLowerCase() + heartParts[questionIndex].description.slice(1)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {practiceOptions(heartParts[questionIndex], questionIndex).map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={Boolean(answerState)}
                      onClick={() => answerQuestion(option)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-slate-200 transition hover:border-cyan-300/50 disabled:cursor-default disabled:opacity-70"
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {answerState && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p role="status" className={`text-xs ${isCorrectAnswer ? "text-emerald-300" : "text-amber-200"}`}>
                      {isCorrectAnswer ? "Correct. The selected part is highlighted in the model." : `Not quite. The answer is ${heartParts[questionIndex].name}.`}
                    </p>
                    <button
                      type="button"
                      onClick={advanceQuestion}
                      className="shrink-0 rounded-lg bg-cyan-400/15 px-3 py-2 text-xs text-cyan-100"
                    >
                      {questionIndex === heartParts.length - 1 ? "See score" : "Next"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {mode === "learn" && (
          <div className="absolute bottom-3 left-3 right-3 z-10 mx-auto max-w-xl rounded-2xl border border-cyan-500/30 bg-slate-950/95 p-4 shadow-xl backdrop-blur">
            {flowFinished ? (
              <div className="text-center">
                <p className="text-xs font-mono uppercase tracking-wider text-cyan-300">Blood flow walkthrough complete</p>
                <p className="mt-1 text-sm text-slate-200">Follow the path again to reinforce how the chambers work together.</p>
                <button
                  type="button"
                  onClick={restartFlow}
                  className="mt-3 rounded-lg border border-cyan-400/40 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-400/10"
                >
                  Restart walkthrough
                </button>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>{flowStep.title}</span>
                  <span>Step {flowStepIndex + 1} of {bloodFlowSteps.length}</span>
                </div>
                <p className="text-sm leading-relaxed text-white">{flowStep.description}</p>
                <div className="mt-3 flex justify-between gap-2">
                  <button
                    type="button"
                    disabled={flowStepIndex === 0}
                    onClick={() => advanceFlow(-1)}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => advanceFlow(1)}
                    className="rounded-lg bg-cyan-400/15 px-3 py-2 text-xs text-cyan-100"
                  >
                    {flowStepIndex === bloodFlowSteps.length - 1 ? "Finish" : "Next step"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {mode === "explore" && (
          <div className="absolute bottom-3 left-3 right-3 z-10 text-center text-xs text-slate-400">
            Select a structure or use the component list · Drag to rotate · Scroll to zoom
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400">Heart explorer</p>
          <h3 className="mt-1 text-base font-semibold text-white">{selectedPart.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{selectedPart.description}</p>
          <p className="mt-3 text-xs text-slate-500">Structure {selectedIndex + 1} of {heartParts.length}</p>
        </div>

        <div className="h-px bg-white/10" />
        {mode === "learn" && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">Blood-flow path</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Right atrium → right ventricle → lungs → left atrium → left ventricle → aorta
            </p>
          </div>
        )}
        <div className="space-y-1">
          <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">Select a structure</p>
          {heartParts.map((part, index) => (
            <button
              key={part.id}
              type="button"
              aria-pressed={selectedPart.id === part.id}
              onClick={() => selectPart(part)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition ${
                selectedPart.id === part.id
                  ? "bg-cyan-400/10 text-cyan-100"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">{index + 1}</span>
              {part.name}
            </button>
          ))}
        </div>

        <div className="mt-auto flex gap-2 border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => selectPart(heartParts[(selectedIndex + 1) % heartParts.length])}
            className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-cyan-300/40"
          >
            Next part
          </button>
          <button
            type="button"
            onClick={() => setViewRevision((revision) => revision + 1)}
            className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:border-cyan-300/40"
          >
            Reset view
          </button>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-500">
          Learning illustration only; it is not a clinical or anatomically precise model.
        </p>
      </aside>
    </div>
  );
}

export function LearningLabCanvas({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return <LearningLab topic="Human heart" reducedMotion={reducedMotion} />;
}
