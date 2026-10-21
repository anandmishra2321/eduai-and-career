"use client";

import React, { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassPanel";
import { counterAnimation, progressBar } from "@/lib/animations";

interface PerformanceCardProps {
  title: string;
  subtitle: string;
  value: number;
  previousValue?: number;
  trend?: "up" | "down" | "stable";
  target?: number;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  color?: "emerald" | "cyan" | "amber" | "rose";
}

export function PerformanceCard({
  title,
  subtitle,
  value,
  previousValue,
  trend = "stable",
  target,
  icon,
  badge,
  color = "cyan",
}: PerformanceCardProps) {
  const valueRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (valueRef.current) {
      counterAnimation(valueRef.current, 0, value, { duration: 1500 });
    }

    if (progressRef.current && target) {
      progressBar(progressRef.current, value / target, { duration: 1200 });
    }
  }, [value, target]);

  const colorClasses = {
    emerald: {
      text: "text-emerald-400",
      bg: "bg-emerald-950/60",
      border: "border-emerald-500/40",
      progress: "bg-emerald-400",
    },
    cyan: {
      text: "text-cyan-400",
      bg: "bg-cyan-950/60",
      border: "border-cyan-500/40",
      progress: "bg-cyan-400",
    },
    amber: {
      text: "text-amber-400",
      bg: "bg-amber-950/60",
      border: "border-amber-500/40",
      progress: "bg-amber-400",
    },
    rose: {
      text: "text-rose-400",
      bg: "bg-rose-950/60",
      border: "border-rose-500/40",
      progress: "bg-rose-400",
    },
  };

  const colors = colorClasses[color];

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-rose-400" />;
    return null;
  };

  const getStatusIcon = () => {
    if (value >= (target || 100) * 0.8) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (value >= (target || 100) * 0.5) return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    return <AlertTriangle className="w-4 h-4 text-rose-400" />;
  };

  return (
    <GlassCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      badge={badge}
      className="relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-3">
        <div ref={valueRef} className="text-3xl font-extrabold font-mono">
          {value}%
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          {getStatusIcon()}
        </div>
      </div>

      {target && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Progress</span>
            <span className={colors.text}>
              {Math.round((value / target) * 100)}% of target
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              ref={progressRef}
              className={`h-full rounded-full ${colors.progress}`}
              style={{ transform: "scaleX(0)", transformOrigin: "left" }}
            />
          </div>
        </div>
      )}

      {previousValue && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Previous</span>
            <span className="text-slate-300">{previousValue}%</span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono mt-1">
            <span className="text-slate-400">Change</span>
            <span className={trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-slate-400"}>
              {trend === "up" ? "+" : trend === "down" ? "-" : ""}{(value - previousValue).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
