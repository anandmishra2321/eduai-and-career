"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Target,
  Plus,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Flag,
  Trash2,
  Edit3,
  Award,
  Zap,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { progressBar, counterAnimation, fadeIn } from "@/lib/animations";

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: "academic" | "skill" | "career" | "project";
  targetDate: string;
  progress: number;
  milestones: Milestone[];
  priority: "high" | "medium" | "low";
}

export function GoalsEngine() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      title: "Master Machine Learning",
      description: "Complete advanced ML courses and build 3 portfolio projects",
      category: "skill",
      targetDate: "2024-12-31",
      progress: 65,
      priority: "high",
      milestones: [
        { id: "1", title: "Complete Deep Learning Specialization", completed: true, dueDate: "2024-06-30" },
        { id: "2", title: "Build Image Classification Project", completed: true, dueDate: "2024-08-15" },
        { id: "3", title: "Complete NLP Course", completed: false, dueDate: "2024-10-31" },
        { id: "4", title: "Deploy ML Model to Production", completed: false, dueDate: "2024-12-15" },
      ],
    },
    {
      id: "2",
      title: "Achieve 90% Academic Score",
      description: "Maintain high attendance and complete all assignments on time",
      category: "academic",
      targetDate: "2024-12-20",
      progress: 82,
      priority: "high",
      milestones: [
        { id: "1", title: "Maintain 95% Attendance", completed: true, dueDate: "2024-11-30" },
        { id: "2", title: "Complete All Assignments", completed: true, dueDate: "2024-12-10" },
        { id: "3", title: "Score 85+ in Final Exams", completed: false, dueDate: "2024-12-20" },
      ],
    },
    {
      id: "3",
      title: "Build Portfolio Website",
      description: "Create a professional portfolio showcasing projects and skills",
      category: "project",
      targetDate: "2024-11-30",
      progress: 45,
      priority: "medium",
      milestones: [
        { id: "1", title: "Design UI/UX", completed: true, dueDate: "2024-10-15" },
        { id: "2", title: "Implement Frontend", completed: false, dueDate: "2024-11-15" },
        { id: "3", title: "Deploy to Cloud", completed: false, dueDate: "2024-11-30" },
      ],
    },
  ]);

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academic":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
      case "skill":
        return "text-cyan-400 bg-cyan-950/60 border-cyan-500/40";
      case "career":
        return "text-amber-400 bg-amber-950/60 border-amber-500/40";
      case "project":
        return "text-purple-400 bg-purple-950/60 border-purple-500/40";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-rose-400 bg-rose-950/60 border-rose-500/40";
      case "medium":
        return "text-amber-400 bg-amber-950/60 border-amber-500/40";
      case "low":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
    }
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              milestones: goal.milestones.map((m) =>
                m.id === milestoneId ? { ...m, completed: !m.completed } : m
              ),
              progress: calculateProgress(
                goal.milestones.map((m) =>
                  m.id === milestoneId ? { ...m, completed: !m.completed } : m
                )
              ),
            }
          : goal
      )
    );
  };

  const calculateProgress = (milestones: Milestone[]) => {
    const completed = milestones.filter((m) => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (selectedGoal?.id === id) setSelectedGoal(null);
  };

  const overallProgress = Math.round(
    goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Goals List */}
      <GlassPanel glow="cyan" className="p-6 lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Your Goals
          </h3>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-500/30">
            {goals.length}
          </span>
        </div>

        {/* Overall Progress */}
        <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">OVERALL PROGRESS</span>
            <span className="text-sm font-bold text-cyan-300">{overallProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {goals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => setSelectedGoal(goal)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedGoal?.id === goal.id
                  ? "bg-cyan-950/40 border-cyan-400/60"
                  : "bg-black/40 border-cyan-500/20 hover:border-cyan-400/40"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white truncate">{goal.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${getCategoryColor(goal.category)}`}>
                      {goal.category}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-cyan-300">{goal.progress}%</div>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    goal.progress >= 80 ? "bg-emerald-400" : goal.progress >= 50 ? "bg-amber-400" : "bg-rose-400"
                  }`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-2">
                <Clock className="w-3 h-3" />
                {goal.targetDate}
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          className="w-full mt-4"
          onClick={() => setIsAddingGoal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Goal
        </Button>
      </GlassPanel>

      {/* Goal Details */}
      {selectedGoal && (
        <GlassPanel glow="cyan" className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{selectedGoal.title}</h2>
              <p className="text-sm text-slate-400">{selectedGoal.description}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteGoal(selectedGoal.id)}
                className="text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Goal Meta */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
              <div className="text-xs font-mono text-slate-400 mb-1">CATEGORY</div>
              <span className={`text-xs font-mono px-2 py-0.5 rounded uppercase border ${getCategoryColor(selectedGoal.category)}`}>
                {selectedGoal.category}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
              <div className="text-xs font-mono text-slate-400 mb-1">PRIORITY</div>
              <span className={`text-xs font-mono px-2 py-0.5 rounded uppercase border ${getPriorityColor(selectedGoal.priority)}`}>
                {selectedGoal.priority}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
              <div className="text-xs font-mono text-slate-400 mb-1">TARGET DATE</div>
              <div className="text-sm font-semibold text-white flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {selectedGoal.targetDate}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-400">PROGRESS</span>
              <span className="text-2xl font-bold font-mono text-cyan-300">{selectedGoal.progress}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                style={{ width: `${selectedGoal.progress}%` }}
              />
            </div>
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flag className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400 uppercase">Milestones</span>
              <span className="text-xs text-slate-400">
                ({selectedGoal.milestones.filter((m) => m.completed).length}/{selectedGoal.milestones.length} completed)
              </span>
            </div>
            <div className="space-y-3">
              {selectedGoal.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  onClick={() => toggleMilestone(selectedGoal.id, milestone.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    milestone.completed
                      ? "bg-emerald-950/40 border-emerald-500/40"
                      : "bg-black/40 border-cyan-500/20 hover:border-cyan-400/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      milestone.completed
                        ? "bg-emerald-950/60 border-emerald-500/40"
                        : "bg-slate-950/60 border-slate-500/40"
                    }`}>
                      {milestone.completed ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${milestone.completed ? "text-emerald-300 line-through" : "text-white"}`}>
                        {milestone.title}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        {milestone.dueDate}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="mt-6 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono text-amber-400 uppercase">AI Recommendation</span>
            </div>
            <p className="text-sm text-slate-300">
              Based on your current progress, focus on completing the &quot;{selectedGoal.milestones.find(m => !m.completed)?.title}&quot; milestone next to stay on track for your target date.
            </p>
          </div>
        </GlassPanel>
      )}

      {!selectedGoal && (
        <GlassPanel glow="cyan" className="p-6 lg:col-span-2 flex items-center justify-center">
          <div className="text-center">
            <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Select a Goal</h3>
            <p className="text-sm text-slate-400 font-mono">
              Choose a goal from the list to view milestones and track progress
            </p>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
