"use client";

import React, { useState } from "react";
import {
  Database,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Shield,
  Users,
  Bell,
  Palette,
  Globe,
  Lock,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Copy,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

interface DatabaseStats {
  totalRecords: number;
  storageUsed: string;
  storageLimit: string;
  lastBackup: string;
  activeConnections: number;
  queryLatency: number;
}

interface UserPreference {
  id: string;
  category: string;
  name: string;
  value: boolean | string;
  description: string;
}

const DATABASE_STATS: DatabaseStats = {
  totalRecords: 45230,
  storageUsed: "2.4 GB",
  storageLimit: "10 GB",
  lastBackup: "2 hours ago",
  activeConnections: 12,
  queryLatency: 15,
};

const USER_PREFERENCES: UserPreference[] = [
  {
    id: "1",
    category: "Notifications",
    name: "Email Notifications",
    value: true,
    description: "Receive email updates about your progress",
  },
  {
    id: "2",
    category: "Notifications",
    name: "Push Notifications",
    value: true,
    description: "Get push notifications for important events",
  },
  {
    id: "3",
    category: "Notifications",
    name: "Weekly Digest",
    value: false,
    description: "Receive weekly summary of your activities",
  },
  {
    id: "4",
    category: "Privacy",
    name: "Profile Visibility",
    value: "public",
    description: "Control who can see your profile",
  },
  {
    id: "5",
    category: "Privacy",
    name: "Data Sharing",
    value: false,
    description: "Allow anonymous data sharing for research",
  },
  {
    id: "6",
    category: "Privacy",
    name: "Two-Factor Auth",
    value: true,
    description: "Enable 2FA for account security",
  },
  {
    id: "7",
    category: "Appearance",
    name: "Dark Mode",
    value: true,
    description: "Use dark theme for the interface",
  },
  {
    id: "8",
    category: "Appearance",
    name: "Compact View",
    value: false,
    description: "Use more compact layout for content",
  },
  {
    id: "9",
    category: "Appearance",
    name: "Animations",
    value: true,
    description: "Enable UI animations and transitions",
  },
  {
    id: "10",
    category: "Performance",
    name: "Auto-Save",
    value: true,
    description: "Automatically save work in progress",
  },
  {
    id: "11",
    category: "Performance",
    name: "Cache Data",
    value: true,
    description: "Cache data for faster loading",
  },
  {
    id: "12",
    category: "Performance",
    name: "Low Power Mode",
    value: false,
    description: "Reduce animations for battery saving",
  },
];

export function DatabaseManager() {
  const [activeTab, setActiveTab] = useState<"database" | "preferences" | "backup">("database");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [preferences, setPreferences] = useState<UserPreference[]>(USER_PREFERENCES);
  const [showPassword, setShowPassword] = useState(false);

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
    }, 2000);
  };

  const togglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, value: typeof p.value === "boolean" ? !p.value : p.value } : p
      )
    );
  };

  const updatePreference = (id: string, value: string) => {
    setPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, value } : p))
    );
  };

  const groupedPreferences = preferences.reduce((acc, pref) => {
    if (!acc[pref.category]) acc[pref.category] = [];
    acc[pref.category].push(pref);
    return acc;
  }, {} as Record<string, UserPreference[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Notifications":
        return <Bell className="h-5 w-5" />;
      case "Privacy":
        return <Shield className="h-5 w-5" />;
      case "Appearance":
        return <Palette className="h-5 w-5" />;
      case "Performance":
        return <Zap className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Database & User Experience</h1>
          <p className="text-muted-foreground">Manage database, preferences, and system settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("database")}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === "database"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="h-4 w-4 inline mr-2" />
            Database
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === "preferences"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Preferences
          </button>
          <button
            onClick={() => setActiveTab("backup")}
            className={`px-4 py-3 font-medium transition-all border-b-2 ${
              activeTab === "backup"
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <HardDrive className="h-4 w-4 inline mr-2" />
            Backup & Restore
          </button>
        </div>

        {/* Database Tab */}
        {activeTab === "database" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="glass rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Records</span>
                </div>
                <div className="text-2xl font-bold">{DATABASE_STATS.totalRecords.toLocaleString()}</div>
              </div>
              <div className="glass rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-5 w-5 text-cyan-400" />
                  <span className="text-sm text-muted-foreground">Storage Used</span>
                </div>
                <div className="text-2xl font-bold">
                  {DATABASE_STATS.storageUsed} <span className="text-sm text-muted-foreground">/ {DATABASE_STATS.storageLimit}</span>
                </div>
                <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: "24%" }} />
                </div>
              </div>
              <div className="glass rounded-lg p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <span className="text-sm text-muted-foreground">Last Backup</span>
                </div>
                <div className="text-2xl font-bold">{DATABASE_STATS.lastBackup}</div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="glass rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium">Active Connections</span>
                </div>
                <div className="text-4xl font-bold text-emerald-400 mb-2">{DATABASE_STATS.activeConnections}</div>
                <div className="text-sm text-muted-foreground">Current database connections</div>
              </div>
              <div className="glass rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">Query Latency</span>
                </div>
                <div className="text-4xl font-bold text-purple-400 mb-2">{DATABASE_STATS.queryLatency}ms</div>
                <div className="text-sm text-muted-foreground">Average response time</div>
              </div>
            </div>

            {/* Database Actions */}
            <div className="glass rounded-lg p-5">
              <h3 className="font-semibold mb-4">Database Actions</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border hover:bg-accent/50 transition-all">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Stats
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border hover:bg-accent/50 transition-all">
                  <BarChart3 className="h-4 w-4" />
                  View Logs
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border hover:bg-accent/50 transition-all text-rose-400 hover:text-rose-500">
                  <Trash2 className="h-4 w-4" />
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            {Object.entries(groupedPreferences).map(([category, prefs]) => (
              <div key={category} className="glass rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  {getCategoryIcon(category)}
                  <h3 className="font-semibold">{category}</h3>
                </div>
                <div className="space-y-4">
                  {prefs.map((pref) => (
                    <div key={pref.id} className="flex items-start justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <div className="font-medium">{pref.name}</div>
                        <div className="text-sm text-muted-foreground">{pref.description}</div>
                      </div>
                      <div className="ml-4">
                        {typeof pref.value === "boolean" ? (
                          <button
                            onClick={() => togglePreference(pref.id)}
                            className={`relative w-12 h-6 rounded-full transition-all ${
                              pref.value ? "bg-primary" : "bg-secondary"
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-all ${
                                pref.value ? "left-7" : "left-1"
                              }`}
                            />
                          </button>
                        ) : (
                          <select
                            value={pref.value as string}
                            onChange={(e) => updatePreference(pref.id, e.target.value)}
                            className="rounded-lg border bg-background px-3 py-1.5 text-sm"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="friends">Friends Only</option>
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Save Button */}
            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground">
                <Save className="h-4 w-4" />
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Backup & Restore Tab */}
        {activeTab === "backup" && (
          <div className="space-y-6">
            {/* Backup Status */}
            <div className="glass rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="font-semibold">Backup Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Last Full Backup</span>
                  <span className="font-medium">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Backup Size</span>
                  <span className="font-medium">1.8 GB</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">Auto-Backup</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    Enabled (Daily)
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Retention Period</span>
                  <span className="font-medium">30 days</span>
                </div>
              </div>
            </div>

            {/* Backup Actions */}
            <div className="glass rounded-lg p-5">
              <h3 className="font-semibold mb-4">Backup Actions</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {isBackingUp ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Backing up...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Create Backup
                    </>
                  )}
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border hover:bg-accent/50 transition-all">
                  <Upload className="h-4 w-4" />
                  Restore Backup
                </button>
              </div>
            </div>

            {/* Backup History */}
            <div className="glass rounded-lg p-5">
              <h3 className="font-semibold mb-4">Backup History</h3>
              <div className="space-y-2">
                {[
                  { date: "Today, 2:30 PM", size: "1.8 GB", type: "Full" },
                  { date: "Yesterday, 2:30 PM", size: "1.7 GB", type: "Full" },
                  { date: "2 days ago, 2:30 PM", size: "1.6 GB", type: "Full" },
                  { date: "3 days ago, 2:30 PM", size: "1.5 GB", type: "Full" },
                ].map((backup, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-accent/30 hover:bg-accent/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{backup.date}</div>
                        <div className="text-sm text-muted-foreground">{backup.type} backup • {backup.size}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-accent rounded-lg transition-all" title="Download">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-accent rounded-lg transition-all" title="Restore">
                        <Upload className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-accent rounded-lg transition-all text-rose-400" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Settings */}
            <div className="glass rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Security Settings</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">API Key</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        value="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                        readOnly
                        className="w-full rounded-lg border bg-background/50 px-4 py-2.5 outline-none focus:border-accent pr-10"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button className="px-4 py-2.5 rounded-lg border hover:bg-accent/50 transition-all">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="px-4 py-2.5 rounded-lg border hover:bg-accent/50 transition-all">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-accent/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Encryption</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    All backups are encrypted using AES-256 encryption. Your data is secure both in transit and at rest.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
