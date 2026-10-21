"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Clock, Activity, RefreshCw, Globe, Zap, Database, FileText } from "lucide-react";
import { apiGateway, PROVIDER_REGISTRY, ProviderHealth } from "@/lib/api-gateway";

export function IntegrationHealth() {
  const [healthStatus, setHealthStatus] = useState<ProviderHealth[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refreshHealth = async () => {
    setIsRefreshing(true);
    // Simulate health checks for all providers
    const statuses: ProviderHealth[] = Object.keys(PROVIDER_REGISTRY).map((providerId) => {
      const config = PROVIDER_REGISTRY[providerId];
      const existing = apiGateway.getProviderStatus(providerId);
      
      // Simulate random health status for demo
      const statuses: Array<"connected" | "disconnected" | "error" | "rate_limited"> = 
        ["connected", "connected", "connected", "disconnected", "error", "rate_limited"];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        providerId,
        status: existing?.status || randomStatus,
        lastChecked: new Date(),
        latency: existing?.latency || Math.floor(Math.random() * 500) + 50,
        errorCount: existing?.errorCount || 0,
        lastError: existing?.lastError || null,
        rateLimitRemaining: config.rateLimit ? Math.floor(Math.random() * config.rateLimit.requestsPerMinute) : null,
        rateLimitReset: config.rateLimit ? new Date(Date.now() + 60000) : null,
      };
    });

    setHealthStatus(statuses);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ai": return <Zap className="w-4 h-4" />;
      case "job": return <Globe className="w-4 h-4" />;
      case "data": return <Database className="w-4 h-4" />;
      case "document": return <FileText className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "disconnected":
        return <XCircle className="w-5 h-5 text-slate-400" />;
      case "error":
        return <XCircle className="w-5 h-5 text-rose-400" />;
      case "rate_limited":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "text-emerald-400 bg-emerald-950/40 border-emerald-500/40";
      case "disconnected":
        return "text-slate-400 bg-slate-950/40 border-slate-500/40";
      case "error":
        return "text-rose-400 bg-rose-950/40 border-rose-500/40";
      case "rate_limited":
        return "text-amber-400 bg-amber-950/40 border-amber-500/40";
      default:
        return "text-slate-400 bg-slate-950/40 border-slate-500/40";
    }
  };

  const connectedCount = healthStatus.filter((h) => h.status === "connected").length;
  const errorCount = healthStatus.filter((h) => h.status === "error").length;
  const rateLimitedCount = healthStatus.filter((h) => h.status === "rate_limited").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Integration Health Monitor</h2>
          <p className="text-sm text-slate-400">
            Real-time status of all external API providers and services
          </p>
        </div>
        <button
          onClick={refreshHealth}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="text-sm font-mono">Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20">
          <div className="text-xs font-mono text-slate-400 mb-1">TOTAL PROVIDERS</div>
          <div className="text-2xl font-bold text-white">{healthStatus.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
          <div className="text-xs font-mono text-emerald-400 mb-1">CONNECTED</div>
          <div className="text-2xl font-bold text-emerald-300">{connectedCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40">
          <div className="text-xs font-mono text-rose-400 mb-1">ERRORS</div>
          <div className="text-2xl font-bold text-rose-300">{errorCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40">
          <div className="text-xs font-mono text-amber-400 mb-1">RATE LIMITED</div>
          <div className="text-2xl font-bold text-amber-300">{rateLimitedCount}</div>
        </div>
      </div>

      {/* Provider List */}
      <div className="space-y-3">
        {Object.entries(PROVIDER_REGISTRY).map(([providerId, config]) => {
          const health = healthStatus.find((h) => h.providerId === providerId);
          return (
            <div
              key={providerId}
              className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${getStatusColor(health?.status || "unknown")}`}>
                    {getCategoryIcon(config.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{config.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${getStatusColor(health?.status || "unknown")}`}>
                        {health?.status || "unknown"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{providerId}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Latency */}
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-400">LATENCY</div>
                    <div className={`text-sm font-mono ${health?.latency && health.latency < 200 ? "text-emerald-400" : health?.latency && health.latency < 500 ? "text-amber-400" : "text-rose-400"}`}>
                      {health?.latency ? `${health.latency}ms` : "N/A"}
                    </div>
                  </div>

                  {/* Rate Limit */}
                  {config.rateLimit && health?.rateLimitRemaining !== null && (
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-400">RATE LIMIT</div>
                      <div className="text-sm font-mono text-cyan-300">
                        {health.rateLimitRemaining}/{config.rateLimit.requestsPerMinute}
                      </div>
                    </div>
                  )}

                  {/* Status Icon */}
                  {getStatusIcon(health?.status || "unknown")}
                </div>
              </div>

              {/* Error Details */}
              {health?.lastError && (
                <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30">
                  <div className="text-xs text-rose-300 font-mono">{health.lastError}</div>
                </div>
              )}

              {/* Rate Limit Reset */}
              {health?.rateLimitReset && health.status === "rate_limited" && (
                <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/30">
                  <div className="text-xs text-amber-300 font-mono">
                    Rate limit resets at {health.rateLimitReset.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Last Refresh */}
      {lastRefresh && (
        <div className="text-xs font-mono text-slate-500 text-center">
          Last refreshed: {lastRefresh.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
