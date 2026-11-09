"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Brain,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  LogOut,
  User,
  Settings,
  Sparkles,
  BarChart3,
  Zap,
  Palette,
  Play,
} from "lucide-react";
import { motion } from "motion/react";
import { CursorFollower } from "../../components/ui/CursorFollower";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState(0);

  const themes = [
    { name: "Purple", from: "from-slate-900", via: "via-purple-900", to: "to-slate-900" },
    { name: "Blue", from: "from-slate-900", via: "via-blue-900", to: "to-slate-900" },
    { name: "Green", from: "from-slate-900", via: "via-emerald-900", to: "to-slate-900" },
    { name: "Orange", from: "from-slate-900", via: "via-orange-900", to: "to-slate-900" },
    { name: "Pink", from: "from-slate-900", via: "via-pink-900", to: "to-slate-900" },
  ];

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const demoMode = localStorage.getItem("demoMode");
    if (!userData && !demoMode) {
      router.push("/login");
    } else {
      setUser(userData ? JSON.parse(userData) : { full_name: "Demo User", name: "Demo User" });
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) return null;

  const stats = [
    { label: "Study Hours", value: "24.5", icon: Clock, color: "from-blue-500 to-cyan-500" },
    { label: "Courses", value: "8", icon: BookOpen, color: "from-purple-500 to-pink-500" },
    { label: "Goals", value: "5", icon: Target, color: "from-emerald-500 to-teal-500" },
    { label: "Streak", value: "12", icon: Award, color: "from-orange-500 to-amber-500" },
  ];

  const recentActivity = [
    { title: "Completed Mathematics Quiz", time: "2 hours ago", type: "quiz" },
    { title: "Started Physics Module", time: "5 hours ago", type: "course" },
    { title: "Achieved Study Goal", time: "1 day ago", type: "goal" },
    { title: "AI Tutor Session", time: "2 days ago", type: "ai" },
  ];

  const upcomingTasks = [
    { title: "Physics Assignment", due: "Tomorrow", priority: "high" },
    { title: "Chemistry Lab Report", due: "In 3 days", priority: "medium" },
    { title: "Math Practice Test", due: "In 5 days", priority: "low" },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themes[currentTheme].from} ${themes[currentTheme].via} ${themes[currentTheme].to} relative overflow-hidden`}>
      <CursorFollower />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">EduAI</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentTheme((prev) => (prev + 1) % themes.length)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="Change Theme"
              >
                <Palette className="w-5 h-5 text-white/70" />
              </button>
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Settings className="w-5 h-5 text-white/70" />
              </button>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">{user.full_name || user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user.full_name || user.name}! 👋
            </h2>
            <p className="text-white/60">Continue your learning journey today</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: Brain, label: "AI Tutor", color: "from-purple-500 to-pink-500" },
                  { icon: BookOpen, label: "Study Mode", color: "from-blue-500 to-cyan-500" },
                  { icon: Target, label: "Set Goals", color: "from-emerald-500 to-teal-500" },
                  { icon: BarChart3, label: "Analytics", color: "from-orange-500 to-amber-500" },
                  { icon: Zap, label: "Quick Quiz", color: "from-rose-500 to-pink-500" },
                  { icon: Calendar, label: "Schedule", color: "from-indigo-500 to-purple-500" },
                ].map((action, index) => (
                  <button
                    key={action.label}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white/80 text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-purple-500" />
                    <div className="flex-1">
                      <div className="text-white text-sm">{activity.title}</div>
                      <div className="text-white/50 text-xs">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Upcoming Tasks</h3>
              <div className="space-y-4">
                {upcomingTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <div className="text-white text-sm font-medium">{task.title}</div>
                      <div className="text-white/50 text-xs">{task.due}</div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === "high"
                          ? "bg-rose-500/20 text-rose-300"
                          : task.priority === "medium"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {task.priority}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Learning Progress</h3>
              <div className="space-y-6">
                {[
                  { subject: "Mathematics", progress: 75 },
                  { subject: "Physics", progress: 60 },
                  { subject: "Chemistry", progress: 45 },
                  { subject: "Biology", progress: 90 },
                ].map((subject, index) => (
                  <div key={subject.subject}>
                    <div className="flex justify-between mb-2">
                      <span className="text-white text-sm">{subject.subject}</span>
                      <span className="text-white/60 text-sm">{subject.progress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.progress}%` }}
                        transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
