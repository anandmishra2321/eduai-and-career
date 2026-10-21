"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Sparkles,
  Target,
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Filter,
  Play,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  RefreshCw,
  Lightbulb,
  GraduationCap,
  Heart,
  Star,
  Activity,
  X,
  Plus,
} from "lucide-react";
import { motion } from "motion/react";

interface LearningSignal {
  id: string;
  type: "performance" | "interest" | "behavior" | "feedback" | "goal";
  name: string;
  value: number;
  weight: number;
  trend: "up" | "down" | "stable";
}

interface Recommendation {
  id: string;
  type: "course" | "resource" | "practice" | "project" | "review";
  title: string;
  description: string;
  confidence: number;
  priority: "high" | "medium" | "low";
  estimatedTime: string;
  skills: string[];
  source: string[];
}

interface LearningPath {
  id: string;
  name: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  estimatedCompletion: string;
  nextModule: string;
}

interface LearningGoal {
  id: string;
  title: string;
  target: string;
  deadline: string;
  progress: number;
  status: "on-track" | "behind" | "ahead";
}

const LEARNING_SIGNALS: LearningSignal[] = [
  { id: "1", type: "performance", name: "Academic Performance", value: 85, weight: 0.3, trend: "up" },
  { id: "2", type: "interest", name: "Subject Interest", value: 78, weight: 0.2, trend: "stable" },
  { id: "3", type: "behavior", name: "Study Consistency", value: 72, weight: 0.25, trend: "up" },
  { id: "4", type: "feedback", name: "Quiz Accuracy", value: 80, weight: 0.15, trend: "up" },
  { id: "5", type: "goal", name: "Goal Alignment", value: 90, weight: 0.1, trend: "stable" },
];

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "1",
    type: "course",
    title: "Advanced Machine Learning",
    description: "Deep dive into neural networks and deep learning architectures",
    confidence: 92,
    priority: "high",
    estimatedTime: "4 weeks",
    skills: ["Python", "TensorFlow", "Deep Learning"],
    source: ["Performance", "Interest", "Career Goals"],
  },
  {
    id: "2",
    type: "practice",
    title: "Algorithm Problem Solving",
    description: "Daily coding practice to strengthen problem-solving skills",
    confidence: 88,
    priority: "high",
    estimatedTime: "30 min/day",
    skills: ["Algorithms", "Data Structures", "Problem Solving"],
    source: ["Performance", "Study Behavior"],
  },
  {
    id: "3",
    type: "resource",
    title: "Database Optimization Techniques",
    description: "Learn advanced SQL and database optimization strategies",
    confidence: 75,
    priority: "medium",
    estimatedTime: "2 weeks",
    skills: ["SQL", "Database Design", "Performance"],
    source: ["Performance Gap", "Career Requirements"],
  },
  {
    id: "4",
    type: "project",
    title: "Build a Recommendation System",
    description: "Apply ML concepts to build a real-world recommendation engine",
    confidence: 85,
    priority: "medium",
    estimatedTime: "3 weeks",
    skills: ["Machine Learning", "Python", "System Design"],
    source: ["Interest", "Portfolio Building"],
  },
  {
    id: "5",
    type: "review",
    title: "Review Computer Networks Fundamentals",
    description: "Strengthen understanding of networking concepts",
    confidence: 70,
    priority: "low",
    estimatedTime: "1 week",
    skills: ["Networking", "Protocols", "Security"],
    source: ["Performance Gap", "Upcoming Exam"],
  },
];

const LEARNING_PATHS: LearningPath[] = [
  {
    id: "1",
    name: "Machine Learning Engineer",
    progress: 65,
    totalModules: 12,
    completedModules: 8,
    estimatedCompletion: "6 weeks",
    nextModule: "Deep Learning Architectures",
  },
  {
    id: "2",
    name: "Full Stack Developer",
    progress: 45,
    totalModules: 15,
    completedModules: 7,
    estimatedCompletion: "10 weeks",
    nextModule: "Advanced React Patterns",
  },
  {
    id: "3",
    name: "Data Science Fundamentals",
    progress: 80,
    totalModules: 10,
    completedModules: 8,
    estimatedCompletion: "2 weeks",
    nextModule: "Statistical Modeling",
  },
];

const LEARNING_GOALS: LearningGoal[] = [
  {
    id: "1",
    title: "Achieve 3.8 GPA",
    target: "3.8 GPA by semester end",
    deadline: "Dec 2026",
    progress: 75,
    status: "on-track",
  },
  {
    id: "2",
    title: "Complete ML Certification",
    target: "Google TensorFlow Certificate",
    deadline: "Jan 2027",
    progress: 40,
    status: "behind",
  },
  {
    id: "3",
    title: "Build 5 Portfolio Projects",
    target: "5 completed projects",
    deadline: "Mar 2027",
    progress: 60,
    status: "ahead",
  },
];

export function LearningEngine() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "recommendations" | "paths" | "goals" | "settings">("dashboard");
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "course" | "practice" | "resource" | "project" | "review">("all");

  const refreshRecommendations = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-500/40">High Priority</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-950/40 text-amber-400 border border-amber-500/40">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-rose-950/40 text-rose-400 border border-rose-500/40">Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-track":
        return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-500/40">On Track</span>;
      case "ahead":
        return <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-950/40 text-cyan-400 border border-cyan-500/40">Ahead</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-rose-950/40 text-rose-400 border border-rose-500/40">Behind</span>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case "down":
        return <TrendingUp className="h-4 w-4 text-rose-400 rotate-180" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredRecommendations = filterType === "all" 
    ? RECOMMENDATIONS 
    : RECOMMENDATIONS.filter(r => r.type === filterType);

  const overallScore = LEARNING_SIGNALS.reduce((acc, signal) => acc + (signal.value * signal.weight), 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Personalized Learning Engine</h1>
            <p className="text-muted-foreground">Multi-signal AI-powered learning recommendations</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshRecommendations}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground">
              <Settings className="h-4 w-4" />
              Configure
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-4 overflow-x-auto">
          {(["dashboard", "recommendations", "paths", "goals", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="glass rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Learning Intelligence Score
                </h2>
                <div className="text-3xl font-bold text-primary">{overallScore.toFixed(1)}%</div>
              </div>
              <div className="w-full bg-background/50 rounded-full h-3">
                <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${overallScore}%` }} />
              </div>
            </div>

            {/* Learning Signals */}
            <div className="glass rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Learning Signals
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {LEARNING_SIGNALS.map((signal) => (
                  <div key={signal.id} className="p-4 rounded-lg bg-accent/30 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{signal.name}</span>
                      {getTrendIcon(signal.trend)}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">{signal.value}%</span>
                      <span className="text-xs text-muted-foreground">Weight: {(signal.weight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-background/50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          signal.value >= 80 ? "bg-emerald-400" : signal.value >= 60 ? "bg-cyan-400" : "bg-amber-400"
                        }`}
                        style={{ width: `${signal.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="glass rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Active Courses</span>
                </div>
                <div className="text-2xl font-bold">3</div>
              </div>
              <div className="glass rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Study Hours</span>
                </div>
                <div className="text-2xl font-bold">25h</div>
                <div className="text-xs text-muted-foreground">this week</div>
              </div>
              <div className="glass rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Skills Gained</span>
                </div>
                <div className="text-2xl font-bold">12</div>
              </div>
              <div className="glass rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Streak</span>
                </div>
                <div className="text-2xl font-bold">7 days</div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === "recommendations" && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {(["all", "course", "practice", "resource", "project", "review"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterType === type ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Recommendations List */}
            <div className="space-y-4">
              {filteredRecommendations.map((rec) => (
                <motion.div
                  key={rec.id}
                  whileHover={{ scale: 1.01 }}
                  className="glass rounded-lg p-5 cursor-pointer border hover:border-accent transition-all"
                  onClick={() => setSelectedRecommendation(rec)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{rec.title}</h3>
                        {getPriorityBadge(rec.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${rec.confidence >= 85 ? "text-emerald-400" : rec.confidence >= 70 ? "text-cyan-400" : "text-amber-400"}`}>
                        {rec.confidence}%
                      </div>
                      <div className="text-xs text-muted-foreground">confidence</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {rec.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        {rec.source.length} signals
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {rec.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="text-xs px-2 py-1 rounded bg-accent/30">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recommendation Detail */}
            {selectedRecommendation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedRecommendation.title}</h2>
                    <p className="text-muted-foreground">{selectedRecommendation.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRecommendation(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                    <div className="text-2xl font-bold text-primary">{selectedRecommendation.confidence}%</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-xs text-muted-foreground mb-1">Estimated Time</div>
                    <div className="text-lg font-semibold">{selectedRecommendation.estimatedTime}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-xs text-muted-foreground mb-1">Priority</div>
                    <div className="text-lg font-semibold capitalize">{selectedRecommendation.priority}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      Skills You'll Gain
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecommendation.skills.map((skill) => (
                        <span key={skill} className="px-3 py-1.5 rounded-lg bg-accent text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Based On
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecommendation.source.map((source) => (
                        <span key={source} className="px-3 py-1.5 rounded-lg bg-accent text-sm">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground">
                    <Play className="h-4 w-4" />
                    Start Learning
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Learning Paths Tab */}
        {activeTab === "paths" && (
          <div className="space-y-6">
            <div className="glass rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Active Learning Paths
              </h2>
              <div className="space-y-4">
                {LEARNING_PATHS.map((path) => (
                  <div key={path.id} className="p-5 rounded-lg bg-accent/30 border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{path.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {path.completedModules} of {path.totalModules} modules completed
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{path.progress}%</div>
                        <div className="text-xs text-muted-foreground">complete</div>
                      </div>
                    </div>

                    <div className="w-full bg-background/50 rounded-full h-2 mb-3">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${path.progress}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next: {path.nextModule}</span>
                      <span className="text-muted-foreground">ETA: {path.estimatedCompletion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div className="space-y-6">
            <div className="glass rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Learning Goals
              </h2>
              <div className="space-y-4">
                {LEARNING_GOALS.map((goal) => (
                  <div key={goal.id} className="p-5 rounded-lg bg-accent/30 border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{goal.title}</h3>
                          {getStatusBadge(goal.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{goal.target}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{goal.progress}%</div>
                        <div className="text-xs text-muted-foreground">{goal.deadline}</div>
                      </div>
                    </div>

                    <div className="w-full bg-background/50 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          goal.status === "ahead" ? "bg-cyan-400" : goal.status === "on-track" ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border">
                <Plus className="h-4 w-4" />
                Add New Goal
              </button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="glass rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Engine Configuration
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-accent/30">
                  <h4 className="font-medium mb-2">Signal Weights</h4>
                  <div className="space-y-3">
                    {LEARNING_SIGNALS.map((signal) => (
                      <div key={signal.id} className="flex items-center justify-between">
                        <span className="text-sm">{signal.name}</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={signal.weight * 100}
                          className="w-32"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-accent/30">
                  <h4 className="font-medium mb-2">Learning Preferences</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Preferred Learning Style</span>
                      <select className="rounded-lg border bg-background/50 px-3 py-2 text-sm">
                        <option>Visual</option>
                        <option>Auditory</option>
                        <option>Reading/Writing</option>
                        <option>Kinesthetic</option>
                      </select>
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Daily Study Goal</span>
                      <select className="rounded-lg border bg-background/50 px-3 py-2 text-sm">
                        <option>30 minutes</option>
                        <option>1 hour</option>
                        <option>2 hours</option>
                        <option>3+ hours</option>
                      </select>
                    </label>
                  </div>
                </div>

                <button className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
