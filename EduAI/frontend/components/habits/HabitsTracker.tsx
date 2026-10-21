"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle,
  Flame,
  TrendingUp,
  Clock,
  Target,
  Plus,
  Trash2,
  Edit3,
  Activity,
  BookOpen,
  Zap,
  Award,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { fadeIn, scaleIn } from "@/lib/animations";

interface Habit {
  id: string;
  name: string;
  category: "study" | "health" | "skill" | "productivity";
  target: string;
  streak: number;
  completedToday: boolean;
  completedDates: string[];
  icon: React.ReactNode;
}

export function HabitsTracker() {
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: "1",
      name: "Deep Study Session",
      category: "study",
      target: "120 minutes",
      streak: 14,
      completedToday: true,
      completedDates: [],
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: "2",
      name: "Algorithm Practice",
      category: "skill",
      target: "2 problems",
      streak: 9,
      completedToday: true,
      completedDates: [],
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: "3",
      name: "Physical Exercise",
      category: "health",
      target: "45 minutes",
      streak: 21,
      completedToday: true,
      completedDates: [],
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: "4",
      name: "System Design Reading",
      category: "study",
      target: "30 minutes",
      streak: 5,
      completedToday: false,
      completedDates: [],
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: "5",
      name: "Morning Routine",
      category: "productivity",
      target: "30 minutes",
      streak: 28,
      completedToday: true,
      completedDates: [],
      icon: <Zap className="w-4 h-4" />,
    },
  ]);

  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [isAddingHabit, setIsAddingHabit] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "study":
        return "text-cyan-400 bg-cyan-950/60 border-cyan-500/40";
      case "health":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
      case "skill":
        return "text-purple-400 bg-purple-950/60 border-purple-500/40";
      case "productivity":
        return "text-amber-400 bg-amber-950/60 border-amber-500/40";
    }
  };

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              completedToday: !habit.completedToday,
              streak: habit.completedToday ? habit.streak - 1 : habit.streak + 1,
            }
          : habit
      )
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const completedToday = habits.filter((h) => h.completedToday).length;
  const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
  const longestStreak = Math.max(...habits.map((h) => h.streak));

  // Generate last 7 days for weekly view
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Habits List */}
      <GlassPanel glow="cyan" className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Daily Habits
          </h3>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded-lg border text-xs font-mono transition-all ${
                  selectedPeriod === period
                    ? "bg-cyan-950/60 border-cyan-400/60 text-cyan-300"
                    : "bg-black/40 border-cyan-500/20 text-slate-400 hover:border-cyan-400/40"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Today's Progress */}
        <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400">TODAY&apos;S PROGRESS</span>
            <span className="text-sm font-bold text-cyan-300">
              {completedToday}/{habits.length} completed
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-500"
              style={{ width: `${(completedToday / habits.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`p-4 rounded-xl border transition-all ${
                habit.completedToday
                  ? "bg-emerald-950/40 border-emerald-500/40"
                  : "bg-black/40 border-cyan-500/20 hover:border-cyan-400/40"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    habit.completedToday
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
                      : "bg-slate-950/60 border-slate-500/40 text-slate-400"
                  }`}>
                    {habit.icon}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${habit.completedToday ? "text-emerald-300" : "text-white"}`}>
                      {habit.name}
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${getCategoryColor(habit.category)}`}>
                      {habit.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className={`p-2 rounded-lg transition-all ${
                    habit.completedToday
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-800 text-slate-400 hover:bg-cyan-950/60 hover:text-cyan-400"
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono">{habit.target}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <Flame className="w-3 h-3" />
                  <span className="font-mono font-bold">{habit.streak} day streak</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          className="w-full mt-4"
          onClick={() => setIsAddingHabit(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Habit
        </Button>
      </GlassPanel>

      {/* Stats Panel */}
      <GlassPanel glow="cyan" className="p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Habit Statistics
        </h3>

        <div className="space-y-4">
          {/* Total Streak */}
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20">
            <div className="text-xs font-mono text-slate-400 mb-1">TOTAL STREAK DAYS</div>
            <div className="text-3xl font-extrabold font-mono text-cyan-300 flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-400" />
              {totalStreak}
            </div>
          </div>

          {/* Longest Streak */}
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20">
            <div className="text-xs font-mono text-slate-400 mb-1">LONGEST STREAK</div>
            <div className="text-3xl font-extrabold font-mono text-emerald-300 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              {longestStreak}
            </div>
            <div className="text-xs text-slate-400 mt-1">days</div>
          </div>

          {/* Completion Rate */}
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20">
            <div className="text-xs font-mono text-slate-400 mb-1">COMPLETION RATE</div>
            <div className="text-3xl font-extrabold font-mono text-purple-300">
              {Math.round((completedToday / habits.length) * 100)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">today</div>
          </div>

          {/* Category Breakdown */}
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20">
            <div className="text-xs font-mono text-slate-400 mb-3">BY CATEGORY</div>
            <div className="space-y-2">
              {(["study", "health", "skill", "productivity"] as const).map((category) => {
                const categoryHabits = habits.filter((h) => h.category === category);
                const completed = categoryHabits.filter((h) => h.completedToday).length;
                const percentage = categoryHabits.length > 0 ? (completed / categoryHabits.length) * 100 : 0;

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize text-slate-300">{category}</span>
                      <span className="font-mono text-slate-400">{completed}/{categoryHabits.length}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percentage === 100 ? "bg-emerald-400" : percentage >= 50 ? "bg-amber-400" : "bg-rose-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Calendar */}
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20">
            <div className="text-xs font-mono text-slate-400 mb-3">LAST 7 DAYS</div>
            <div className="grid grid-cols-7 gap-1">
              {last7Days.map((day, i) => {
                const isCompleted = Math.random() > 0.3; // Simulated completion
                return (
                  <div
                    key={i}
                    className={`p-2 rounded-lg text-center ${
                      isCompleted
                        ? "bg-emerald-950/60 border border-emerald-500/40"
                        : "bg-slate-950/60 border border-slate-500/40"
                    }`}
                  >
                    <div className="text-[8px] font-mono text-slate-400 mb-1">{day.split(" ")[0]}</div>
                    <div className={`w-2 h-2 rounded-full mx-auto ${
                      isCompleted ? "bg-emerald-400" : "bg-slate-600"
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
