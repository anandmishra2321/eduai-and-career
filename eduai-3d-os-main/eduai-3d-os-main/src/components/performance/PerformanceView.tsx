"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Brain,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap,
  BookOpen,
  Clock,
  Award,
} from "lucide-react";
import { motion } from "motion/react";

interface PerformanceMetrics {
  gpa: number;
  attendance: number;
  studyHours: number;
  assignmentsCompleted: number;
  quizzesScore: number;
  predictedGPA: number;
  confidence: number;
}

interface SubjectPerformance {
  subject: string;
  currentGrade: number;
  predictedGrade: number;
  trend: "up" | "down" | "stable";
  recommendations: string[];
}

interface MLModelInfo {
  name: string;
  accuracy: string;
  type: string;
  features: string[];
}

const ML_MODELS: MLModelInfo[] = [
  {
    name: "Random Forest",
    accuracy: "R² = 0.81, MAE = 1.17, RMSE = 1.97",
    type: "Performance Prediction",
    features: ["Attendance", "Study Hours", "Quiz Scores", "Assignment Grades", "Previous GPA"],
  },
  {
    name: "CatBoost",
    accuracy: "Feature weights loaded",
    type: "Career Intelligence",
    features: ["Skills", "Interests", "Academic Performance", "Extracurriculars"],
  },
  {
    name: "XGBoost",
    accuracy: "R² = 0.80",
    type: "Placement Prediction",
    features: ["GPA", "Technical Skills", "Projects", "Internships", "Certifications"],
  },
];

export function PerformanceView() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    gpa: 3.5,
    attendance: 85,
    studyHours: 25,
    assignmentsCompleted: 12,
    quizzesScore: 78,
    predictedGPA: 3.7,
    confidence: 0.81,
  });

  const [subjects, setSubjects] = useState<SubjectPerformance[]>([
    {
      subject: "Data Structures",
      currentGrade: 85,
      predictedGrade: 88,
      trend: "up",
      recommendations: ["Focus on tree algorithms", "Practice more coding problems"],
    },
    {
      subject: "Machine Learning",
      currentGrade: 78,
      predictedGrade: 82,
      trend: "up",
      recommendations: ["Review gradient descent", "Complete project assignments"],
    },
    {
      subject: "Database Systems",
      currentGrade: 72,
      predictedGrade: 75,
      trend: "stable",
      recommendations: ["Practice SQL queries", "Learn normalization"],
    },
    {
      subject: "Computer Networks",
      currentGrade: 80,
      predictedGrade: 79,
      trend: "down",
      recommendations: ["Review OSI model", "Practice subnetting"],
    },
  ]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<"week" | "month" | "semester">("semester");

  const runMLAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate ML inference
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setMetrics((prev) => ({
      ...prev,
      predictedGPA: 3.8,
      confidence: 0.85,
    }));
    
    setIsAnalyzing(false);
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return "text-emerald-400";
    if (grade >= 80) return "text-cyan-400";
    if (grade >= 70) return "text-amber-400";
    return "text-rose-400";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-rose-400" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance Intelligence</h1>
            <p className="text-muted-foreground">ML-powered academic performance analysis</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={runMLAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
              {isAnalyzing ? "Analyzing..." : "Run ML Analysis"}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border">
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Current GPA</span>
            </div>
            <div className="text-3xl font-bold">{metrics.gpa.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">out of 4.0</div>
          </div>

          <div className="glass rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Predicted GPA</span>
            </div>
            <div className="text-3xl font-bold">{metrics.predictedGPA.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.confidence * 100}% confidence
            </div>
          </div>

          <div className="glass rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Attendance</span>
            </div>
            <div className="text-3xl font-bold">{metrics.attendance}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.attendance >= 75 ? "On track" : "Needs improvement"}
            </div>
          </div>

          <div className="glass rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-xs text-muted-foreground">Study Hours</span>
            </div>
            <div className="text-3xl font-bold">{metrics.studyHours}h</div>
            <div className="text-xs text-muted-foreground mt-1">this week</div>
          </div>
        </div>

        {/* ML Models Info */}
        <div className="glass rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            ML Model Registry
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {ML_MODELS.map((model) => (
              <div key={model.name} className="p-4 rounded-lg bg-accent/30 border">
                <div className="font-medium mb-2">{model.name}</div>
                <div className="text-xs text-muted-foreground mb-2">{model.type}</div>
                <div className="text-xs font-mono text-primary mb-3">{model.accuracy}</div>
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium mb-1">Features:</div>
                  <ul className="space-y-0.5">
                    {model.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Performance */}
        <div className="glass rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Subject Performance Analysis
          </h2>
          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.subject} className="p-4 rounded-lg bg-accent/30 border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                      {getTrendIcon(subject.trend)}
                    </div>
                    <div>
                      <div className="font-medium">{subject.subject}</div>
                      <div className="text-xs text-muted-foreground">
                        Current: {subject.currentGrade}% | Predicted: {subject.predictedGrade}%
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${getGradeColor(subject.predictedGrade)}`}>
                    {subject.predictedGrade}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        subject.predictedGrade >= 80
                          ? "bg-emerald-400"
                          : subject.predictedGrade >= 70
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                      style={{ width: `${subject.predictedGrade}%` }}
                    />
                  </div>
                </div>

                {/* Recommendations */}
                <div className="flex gap-2 flex-wrap">
                  {subject.recommendations.map((rec) => (
                    <span
                      key={rec}
                      className="text-xs px-2 py-1 rounded bg-background/50 text-muted-foreground"
                    >
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="glass rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI-Powered Insights
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-emerald-300">Strengths</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Strong performance in Data Structures</li>
                <li>• Consistent attendance above 80%</li>
                <li>• Good quiz completion rate</li>
                <li>• ML model predicts GPA improvement</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-500/40">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="font-medium text-amber-300">Areas for Improvement</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Database Systems needs focus</li>
                <li>• Increase study hours by 5h/week</li>
                <li>• Complete pending assignments</li>
                <li>• Review Computer Networks concepts</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-accent/30 border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Personalized Recommendations</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Based on Random Forest analysis (R² = 0.81), focusing on Database Systems and increasing study
                hours to 30h/week could improve your predicted GPA from 3.7 to 3.9 by semester end.
              </p>
              <p>
                The model indicates that attendance and quiz completion are the strongest predictors of your
                academic success. Maintaining current attendance patterns is critical.
              </p>
            </div>
          </div>
        </div>

        {/* Performance Timeline */}
        <div className="glass rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            Performance Timeline
          </h2>
          <div className="flex gap-2 mb-4">
            {(["week", "month", "semester"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedTimeRange === range
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          <div className="h-64 flex items-center justify-center border border-dashed rounded-lg bg-background/30">
            <div className="text-center text-muted-foreground">
              <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Performance chart visualization</p>
              <p className="text-xs">GPA trends over {selectedTimeRange}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
