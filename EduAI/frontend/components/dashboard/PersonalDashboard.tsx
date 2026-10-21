"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  TrendingUp,
  Target,
  Calendar,
  Award,
  Zap,
  BookOpen,
  Network,
  Briefcase,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassCard } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { counterAnimation, progressBar, fadeIn } from "@/lib/animations";

interface DashboardMetric {
  label: string;
  value: number;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
  color: string;
}

interface NextAction {
  title: string;
  description: string;
  reason: string;
  priority: "high" | "medium" | "low";
  action: string;
}

export function PersonalDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([
    {
      label: "Academic Score",
      value: 89,
      trend: "up",
      icon: <Activity className="w-5 h-5" />,
      color: "text-emerald-400",
    },
    {
      label: "Skill Mastery",
      value: 78,
      trend: "up",
      icon: <Network className="w-5 h-5" />,
      color: "text-cyan-400",
    },
    {
      label: "Career Readiness",
      value: 82,
      trend: "stable",
      icon: <Briefcase className="w-5 h-5" />,
      color: "text-amber-400",
    },
    {
      label: "Habit Streak",
      value: 14,
      trend: "up",
      icon: <Calendar className="w-5 h-5" />,
      color: "text-purple-400",
    },
  ]);

  const [nextAction, setNextAction] = useState<NextAction>({
    title: "Complete SQL JOIN Practice",
    description: "Practice advanced SQL JOIN operations to strengthen database skills",
    reason: "Your recent quiz results show weakness in SQL joins",
    priority: "high",
    action: "Start Practice",
  });

  const [weeklyProgress, setWeeklyProgress] = useState([
    { day: "Mon", completed: 85 },
    { day: "Tue", completed: 92 },
    { day: "Wed", completed: 78 },
    { day: "Thu", completed: 95 },
    { day: "Fri", completed: 88 },
    { day: "Sat", completed: 70 },
    { day: "Sun", completed: 0 },
  ]);

  const scoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scoreRef.current) {
      counterAnimation(scoreRef.current, 0, 89, { duration: 1500 });
    }
  }, []);

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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case "down":
        return <TrendingUp className="w-4 h-4 text-rose-400 rotate-180" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Personal Intelligence Dashboard</h1>
          <p className="text-sm text-slate-400 font-mono">
            Your complete educational journey at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Overall Score</span>
          <div ref={scoreRef} className="text-3xl font-extrabold font-mono text-cyan-300">
            89
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <GlassCard
            key={index}
            title={metric.label}
            subtitle="Current Status"
            icon={metric.icon}
            className="relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`text-3xl font-extrabold font-mono ${metric.color}`}>
                {metric.value}
              </div>
              {getTrendIcon(metric.trend)}
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  metric.value >= 80 ? "bg-emerald-400" : metric.value >= 60 ? "bg-amber-400" : "bg-rose-400"
                }`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Best Action */}
        <GlassPanel glow="cyan" className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">NEXT BEST ACTION</h3>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-cyan-950/40 border border-amber-500/30 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-lg font-bold text-white mb-1">{nextAction.title}</h4>
                <p className="text-sm text-slate-300">{nextAction.description}</p>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${getPriorityColor(nextAction.priority)}`}>
                {nextAction.priority} PRIORITY
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-400">
                  <span className="text-slate-300 font-semibold">AI Reasoning:</span> {nextAction.reason}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full mt-4"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {nextAction.action}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <BookOpen className="w-4 h-4" />, label: "Study Plan", color: "text-cyan-400" },
              { icon: <Target className="w-4 h-4" />, label: "Take Quiz", color: "text-emerald-400" },
              { icon: <Network className="w-4 h-4" />, label: "Skills", color: "text-purple-400" },
              { icon: <Briefcase className="w-4 h-4" />, label: "Career", color: "text-amber-400" },
            ].map((action, i) => (
              <button
                key={i}
                className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-950/30 transition-all flex flex-col items-center gap-2 group"
              >
                <div className={action.color}>{action.icon}</div>
                <span className="text-xs font-mono text-slate-300 group-hover:text-white">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </GlassPanel>

        {/* Weekly Progress */}
        <GlassPanel glow="cyan" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">WEEKLY PROGRESS</h3>
          </div>

          <div className="space-y-3">
            {weeklyProgress.map((day, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-8">{day.day}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      day.completed >= 80 ? "bg-emerald-400" : day.completed >= 50 ? "bg-amber-400" : "bg-rose-400"
                    }`}
                    style={{ width: `${day.completed}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-300 w-10 text-right">
                  {day.completed}%
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-black/40 border border-cyan-500/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Weekly Average</span>
              <span className="font-mono text-cyan-300 font-bold">
                {Math.round(weeklyProgress.reduce((a, b) => a + b.completed, 0) / 7)}%
              </span>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Intelligence Nodes Status */}
      <GlassPanel glow="cyan" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">INTELLIGENCE NODES STATUS</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Academic", status: "active", score: 89 },
            { name: "Skills", status: "active", score: 78 },
            { name: "Career", status: "active", score: 82 },
            { name: "Study", status: "active", score: 75 },
            { name: "Quiz", status: "idle", score: 0 },
            { name: "Resume", status: "active", score: 78 },
          ].map((node, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border transition-all ${
                node.status === "active"
                  ? "bg-cyan-950/40 border-cyan-400/60"
                  : "bg-black/40 border-cyan-500/20"
              }`}
            >
              <div className="text-xs font-mono text-slate-400 mb-1">{node.name}</div>
              <div className={`text-lg font-bold font-mono ${
                node.status === "active" ? "text-cyan-300" : "text-slate-500"
              }`}>
                {node.score}%
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 capitalize">
                {node.status}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Recent Activity */}
      <GlassPanel glow="cyan" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">RECENT ACTIVITY</h3>
        </div>

        <div className="space-y-3">
          {[
            { action: "Completed ML Quiz", time: "2 hours ago", type: "quiz" },
            { action: "Updated Resume", time: "5 hours ago", type: "resume" },
            { action: "Study Session: Neural Networks", time: "1 day ago", type: "study" },
            { action: "Achieved 14-day habit streak", time: "1 day ago", type: "habit" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activity.type === "quiz" ? "bg-purple-950/60 text-purple-400" :
                  activity.type === "resume" ? "bg-amber-950/60 text-amber-400" :
                  activity.type === "study" ? "bg-cyan-950/60 text-cyan-400" :
                  "bg-emerald-950/60 text-emerald-400"
                }`}>
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-sm text-slate-300">{activity.action}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
