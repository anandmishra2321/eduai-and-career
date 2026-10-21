"use client";

import React, { useState } from "react";
import {
  Database,
  Globe,
  Cloud,
  FileText,
  Link,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  Search,
  Filter,
  Zap,
  Clock,
  Activity,
  Shield,
  Key,
  Plug,
  Unplug,
  X,
} from "lucide-react";
import { motion } from "motion/react";

interface Connector {
  id: string;
  name: string;
  type: "database" | "api" | "file" | "stream";
  status: "connected" | "disconnected" | "error";
  lastSync: string;
  dataPoints: number;
  latency: number;
  description: string;
  icon: React.ReactNode;
}

const CONNECTORS: Connector[] = [
  {
    id: "1",
    name: "PostgreSQL Database",
    type: "database",
    status: "connected",
    lastSync: "2 min ago",
    dataPoints: 15420,
    latency: 12,
    description: "Primary academic performance database",
    icon: <Database className="h-5 w-5" />,
  },
  {
    id: "2",
    name: "Google Sheets API",
    type: "api",
    status: "connected",
    lastSync: "5 min ago",
    dataPoints: 890,
    latency: 45,
    description: "Student grades and attendance tracking",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "3",
    name: "Canvas LMS",
    type: "api",
    status: "connected",
    lastSync: "1 min ago",
    dataPoints: 3200,
    latency: 23,
    description: "Learning management system integration",
    icon: <Globe className="h-5 w-5" />,
  },
  {
    id: "4",
    name: "Real-time Analytics Stream",
    type: "stream",
    status: "connected",
    lastSync: "Just now",
    dataPoints: 450,
    latency: 8,
    description: "Live student activity monitoring",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    id: "5",
    name: "AWS S3 Bucket",
    type: "file",
    status: "disconnected",
    lastSync: "2 hours ago",
    dataPoints: 0,
    latency: 0,
    description: "Document and resource storage",
    icon: <Cloud className="h-5 w-5" />,
  },
  {
    id: "6",
    name: "External API Gateway",
    type: "api",
    status: "error",
    lastSync: "Failed",
    dataPoints: 0,
    latency: 0,
    description: "Third-party data integration service",
    icon: <Link className="h-5 w-5" />,
  },
];

export function DataConnectors() {
  const [connectors, setConnectors] = useState<Connector[]>(CONNECTORS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "database" | "api" | "file" | "stream">("all");
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-500/40">
            <CheckCircle className="h-3 w-3" />
            Connected
          </span>
        );
      case "disconnected":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-amber-950/40 text-amber-400 border border-amber-500/40">
            <Unplug className="h-3 w-3" />
            Disconnected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-rose-950/40 text-rose-400 border border-rose-500/40">
            <AlertCircle className="h-3 w-3" />
            Error
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "database":
        return <Database className="h-4 w-4" />;
      case "api":
        return <Globe className="h-4 w-4" />;
      case "file":
        return <Cloud className="h-4 w-4" />;
      case "stream":
        return <Activity className="h-4 w-4" />;
      default:
        return <Link className="h-4 w-4" />;
    }
  };

  const filteredConnectors = connectors.filter(
    (connector) =>
      connector.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterType === "all" || connector.type === filterType)
  );

  const syncConnector = (id: string) => {
    setConnectors((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "connected" as const, lastSync: "Just now" }
          : c
      )
    );
  };

  const disconnectConnector = (id: string) => {
    setConnectors((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "disconnected" as const, lastSync: "Disconnected" }
          : c
      )
    );
  };

  const deleteConnector = (id: string) => {
    setConnectors((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Live Data Connectors</h1>
            <p className="text-muted-foreground">Manage external data sources and integrations</p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Add Connector
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="glass rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Plug className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Connectors</span>
            </div>
            <div className="text-2xl font-bold">{connectors.length}</div>
          </div>
          <div className="glass rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="text-sm text-muted-foreground">Connected</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {connectors.filter((c) => c.status === "connected").length}
            </div>
          </div>
          <div className="glass rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <span className="text-sm text-muted-foreground">Data Points</span>
            </div>
            <div className="text-2xl font-bold">
              {connectors.reduce((acc, c) => acc + c.dataPoints, 0).toLocaleString()}
            </div>
          </div>
          <div className="glass rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <span className="text-sm text-muted-foreground">Avg Latency</span>
            </div>
            <div className="text-2xl font-bold">
              {Math.round(
                connectors
                  .filter((c) => c.status === "connected")
                  .reduce((acc, c) => acc + c.latency, 0) /
                  connectors.filter((c) => c.status === "connected").length || 0
              )}
              ms
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search connectors..."
              className="w-full rounded-lg border bg-background/50 pl-10 pr-4 py-2.5 outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "database", "api", "file", "stream"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  filterType === type ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Connectors Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredConnectors.map((connector) => (
            <motion.div
              key={connector.id}
              whileHover={{ scale: 1.02 }}
              className="glass rounded-lg p-5 cursor-pointer border hover:border-accent transition-all"
              onClick={() => setSelectedConnector(connector)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/30 flex items-center justify-center text-primary">
                  {connector.icon}
                </div>
                {getStatusBadge(connector.status)}
              </div>

              <h3 className="font-semibold mb-1">{connector.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{connector.description}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="flex items-center gap-1">
                    {getTypeIcon(connector.type)}
                    <span className="capitalize">{connector.type}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span>{connector.lastSync}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data Points</span>
                  <span>{connector.dataPoints.toLocaleString()}</span>
                </div>
                {connector.status === "connected" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Latency</span>
                    <span>{connector.latency}ms</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Connector Detail Modal */}
        {selectedConnector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedConnector(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass rounded-lg p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-accent/30 flex items-center justify-center text-primary">
                    {selectedConnector.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedConnector.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedConnector.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedConnector(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getStatusBadge(selectedConnector.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{selectedConnector.type}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-xs text-muted-foreground mb-1">Data Points</div>
                    <div className="text-xl font-bold">{selectedConnector.dataPoints.toLocaleString()}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-xs text-muted-foreground mb-1">Latency</div>
                    <div className="text-xl font-bold">{selectedConnector.latency}ms</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-accent/30">
                  <div className="text-xs text-muted-foreground mb-2">Configuration</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sync Interval</span>
                      <span>5 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Retry Policy</span>
                      <span>3 attempts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Timeout</span>
                      <span>30 seconds</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedConnector.status !== "connected" ? (
                  <button
                    onClick={() => syncConnector(selectedConnector.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground"
                  >
                    <Plug className="h-4 w-4" />
                    Connect
                  </button>
                ) : (
                  <button
                    onClick={() => syncConnector(selectedConnector.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Sync Now
                  </button>
                )}
                <button
                  onClick={() => disconnectConnector(selectedConnector.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border"
                >
                  <Unplug className="h-4 w-4" />
                  Disconnect
                </button>
                <button
                  onClick={() => {
                    deleteConnector(selectedConnector.id);
                    setSelectedConnector(null);
                  }}
                  className="px-4 py-2.5 rounded-lg border text-rose-400 hover:bg-rose-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Add Connector Modal */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsAdding(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-lg p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Add New Connector</h2>
                  <p className="text-sm text-muted-foreground">Configure a new data source integration</p>
                </div>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Connector Name</label>
                  <input
                    type="text"
                    placeholder="Enter connector name..."
                    className="w-full rounded-lg border bg-background/50 px-4 py-2.5 outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Connector Type</label>
                  <select className="w-full rounded-lg border bg-background/50 px-4 py-2.5 outline-none focus:border-accent">
                    <option>Database</option>
                    <option>API</option>
                    <option>File Storage</option>
                    <option>Stream</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Connection URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="w-full rounded-lg border bg-background/50 px-4 py-2.5 outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">API Key / Credentials</label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      className="w-full rounded-lg border bg-background/50 px-4 py-2.5 outline-none focus:border-accent pr-10"
                    />
                    <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-accent/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Security Settings</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Enable SSL/TLS</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span>Encrypt data at rest</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground"
                >
                  Add Connector
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
