"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  TrendingUp,
  Target,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { fadeIn, scaleIn, counterAnimation, progressBar } from "@/lib/animations";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
}

interface QuizResult {
  score: number;
  total: number;
  accuracy: number;
  timeTaken: number;
  weakTopics: string[];
  strongTopics: string[];
  recommendations: string[];
}

export function QuizSystem() {
  const [quizState, setQuizState] = useState<"setup" | "active" | "result">("setup");
  const [selectedTopic, setSelectedTopic] = useState("Machine Learning");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scoreRef = useRef<HTMLDivElement>(null);

  const sampleQuestions: QuizQuestion[] = [
    {
      id: "1",
      question: "In CatBoost, what is the default algorithm for handling categorical features during gradient boosting?",
      options: [
        "One-hot encoding for all levels",
        "Target statistics with ordered target encoding to prevent target leakage",
        "Ordinal integer mapping with random jitter",
        "Binary frequency hashing",
      ],
      correctIndex: 1,
      explanation: "CatBoost uses ordered target encoding on sequential permutations of data to prevent target leakage.",
      difficulty: "Medium",
      topic: "Machine Learning",
    },
    {
      id: "2",
      question: "Which WebGL technique is critical for rendering 1,000+ interactive nodes in a single draw call?",
      options: [
        "Dynamic DOM rendering",
        "Hardware Instancing (THREE.InstancedMesh)",
        "CSS 3D Transforms",
        "SVG Path Matrix multiplication",
      ],
      correctIndex: 1,
      explanation: "InstancedMesh allows thousands of geometries sharing the same material to render in a single GPU draw call.",
      difficulty: "Medium",
      topic: "WebGL",
                },
    {
      id: "3",
      question: "What is the primary purpose of the attention mechanism in Transformer models?",
      options: [
        "To reduce model size",
        "To allow the model to focus on relevant parts of the input sequence",
        "To speed up training",
        "To handle categorical features",
      ],
      correctIndex: 1,
      explanation: "Attention mechanisms enable models to weigh the importance of different input tokens when producing outputs.",
      difficulty: "Easy",
      topic: "Deep Learning",
    },
    {
      id: "4",
      question: "Which SQL JOIN returns all records from the left table and matching records from the right table?",
      options: [
        "INNER JOIN",
        "LEFT JOIN",
        "RIGHT JOIN",
        "FULL OUTER JOIN",
      ],
      correctIndex: 1,
      explanation: "LEFT JOIN returns all records from the left table and matched records from the right, with NULL for non-matches.",
      difficulty: "Easy",
      topic: "SQL",
    },
    {
      id: "5",
      question: "What is the time complexity of binary search in a sorted array?",
      options: [
        "O(n)",
        "O(log n)",
        "O(n²)",
        "O(1)",
      ],
      correctIndex: 1,
      explanation: "Binary search divides the search space in half each iteration, resulting in O(log n) complexity.",
      difficulty: "Easy",
      topic: "Algorithms",
    },
  ];

  const topics = ["Machine Learning", "SQL", "Algorithms", "WebGL", "Deep Learning", "Python"];
  const difficulties: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Medium", "Hard"];

  useEffect(() => {
    if (quizState === "active") {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState]);

  useEffect(() => {
    if (scoreRef.current && quizState === "result") {
      counterAnimation(scoreRef.current, 0, score, { duration: 1500 });
    }
  }, [score, quizState]);

  const startQuiz = () => {
    setQuizState("active");
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setTimeElapsed(0);
  };

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = sampleQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctIndex;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questionCount - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const accuracy = (score / questionCount) * 100;
    const weakTopics = sampleQuestions
      .filter((q, i) => {
        const userAnswer = sampleQuestions[i].correctIndex;
        return userAnswer !== q.correctIndex;
      })
      .map((q) => q.topic);

    const strongTopics = sampleQuestions
      .filter((q, i) => {
        const userAnswer = sampleQuestions[i].correctIndex;
        return userAnswer === q.correctIndex;
      })
      .map((q) => q.topic);

    setQuizResult({
      score,
      total: questionCount,
      accuracy,
      timeTaken: timeElapsed,
      weakTopics: [...new Set(weakTopics)],
      strongTopics: [...new Set(strongTopics)],
      recommendations: accuracy < 60
        ? ["Review " + weakTopics[0], "Practice more " + selectedDifficulty + " questions"]
        : ["Excellent! Try Hard difficulty", "Explore advanced topics"],
    });
    setQuizState("result");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
      case "Medium":
        return "text-amber-400 bg-amber-950/60 border-amber-500/40";
      case "Hard":
        return "text-rose-400 bg-rose-950/60 border-rose-500/40";
    }
  };

  if (quizState === "setup") {
    return (
      <GlassPanel glow="cyan" className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">ADAPTIVE QUIZ SYSTEM</h2>
            <p className="text-xs text-slate-400 font-mono">
              Test your knowledge with AI-generated assessments
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Topic Selection */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2 uppercase">
              Select Topic
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {topics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-3 rounded-xl border transition-all text-sm font-medium ${
                    selectedTopic === topic
                      ? "bg-cyan-950/60 border-cyan-400/60 text-cyan-300"
                      : "bg-black/40 border-cyan-500/20 text-slate-400 hover:border-cyan-400/40"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2 uppercase">
              Difficulty Level
            </label>
            <div className="flex gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`flex-1 p-3 rounded-xl border transition-all text-sm font-medium ${
                    selectedDifficulty === diff
                      ? `${getDifficultyColor(diff)}`
                      : "bg-black/40 border-cyan-500/20 text-slate-400 hover:border-cyan-400/40"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-2 uppercase">
              Number of Questions
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`flex-1 p-3 rounded-xl border transition-all text-sm font-medium ${
                    questionCount === count
                      ? "bg-cyan-950/60 border-cyan-400/60 text-cyan-300"
                      : "bg-black/40 border-cyan-500/20 text-slate-400 hover:border-cyan-400/40"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={startQuiz}
            rightIcon={<Play className="w-4 h-4" />}
          >
            START QUIZ
          </Button>
        </div>
      </GlassPanel>
    );
  }

  if (quizState === "active") {
    const currentQuestion = sampleQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questionCount) * 100;

    return (
      <GlassPanel glow="cyan" className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{selectedTopic}</h2>
              <p className="text-xs text-slate-400 font-mono">
                Question {currentQuestionIndex + 1} of {questionCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-mono text-cyan-400">
              <Clock className="w-4 h-4" />
              {formatTime(timeElapsed)}
            </div>
            <div className="flex items-center gap-2 text-sm font-mono text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              {score}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-6">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${getDifficultyColor(currentQuestion.difficulty)}`}>
              {currentQuestion.difficulty}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {currentQuestion.topic}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white leading-relaxed">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            let optionClass = "bg-black/40 border-cyan-500/20 text-slate-300 hover:border-cyan-400/40";
            
            if (showExplanation) {
              if (index === currentQuestion.correctIndex) {
                optionClass = "bg-emerald-950/60 border-emerald-500/60 text-emerald-200";
              } else if (index === selectedAnswer && index !== currentQuestion.correctIndex) {
                optionClass = "bg-rose-950/60 border-rose-500/60 text-rose-200";
              }
            } else if (selectedAnswer === index) {
              optionClass = "bg-cyan-950/60 border-cyan-400/60 text-cyan-200";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showExplanation}
                className={`w-full p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${optionClass}`}
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-sm ${
                  showExplanation && index === currentQuestion.correctIndex
                    ? "border-emerald-400 bg-emerald-950/60"
                    : showExplanation && index === selectedAnswer && index !== currentQuestion.correctIndex
                    ? "border-rose-400 bg-rose-950/60"
                    : "border-cyan-500/30"
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1">{option}</span>
                {showExplanation && index === currentQuestion.correctIndex && (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                )}
                {showExplanation && index === selectedAnswer && index !== currentQuestion.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono text-cyan-400 uppercase">Explanation</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!showExplanation ? (
            <Button
              variant="primary"
              className="flex-1"
              onClick={submitAnswer}
              disabled={selectedAnswer === null}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              variant="primary"
              className="flex-1"
              onClick={nextQuestion}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              {currentQuestionIndex < questionCount - 1 ? "Next Question" : "View Results"}
            </Button>
          )}
        </div>
      </GlassPanel>
    );
  }

  if (quizState === "result" && quizResult) {
    return (
      <GlassPanel glow="cyan" className="p-6 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">QUIZ COMPLETE</h2>
          <p className="text-sm text-slate-400 font-mono">
            {selectedTopic} • {selectedDifficulty} • {questionCount} Questions
          </p>
        </div>

        {/* Score Card */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
            <div className="text-xs font-mono text-slate-400 mb-1">SCORE</div>
            <div ref={scoreRef} className="text-3xl font-extrabold font-mono text-cyan-300">
              {quizResult.score}
            </div>
            <div className="text-xs text-slate-400 mt-1">/ {quizResult.total}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
            <div className="text-xs font-mono text-slate-400 mb-1">ACCURACY</div>
            <div className="text-3xl font-extrabold font-mono text-emerald-300">
              {quizResult.accuracy.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">correct</div>
          </div>
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
            <div className="text-xs font-mono text-slate-400 mb-1">TIME</div>
            <div className="text-3xl font-extrabold font-mono text-amber-300">
              {formatTime(quizResult.timeTaken)}
            </div>
            <div className="text-xs text-slate-400 mt-1">elapsed</div>
          </div>
        </div>

        {/* Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400 uppercase">Strong Topics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quizResult.strongTopics.length > 0 ? (
                quizResult.strongTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono"
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">None identified</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-mono text-rose-400 uppercase">Weak Topics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {quizResult.weakTopics.length > 0 ? (
                quizResult.weakTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono"
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">None identified</span>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono text-cyan-400 uppercase">AI Recommendations</span>
          </div>
          <div className="space-y-2">
            {quizResult.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                {rec}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setQuizState("setup")}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            New Quiz
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              setQuizState("setup");
              setSelectedDifficulty(
                quizResult.accuracy > 80 ? "Hard" : quizResult.accuracy > 60 ? "Medium" : "Easy"
              );
            }}
            rightIcon={<Target className="w-4 h-4" />}
          >
            Practice Weak Areas
          </Button>
        </div>
      </GlassPanel>
    );
  }

  return null;
}
