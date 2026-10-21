"use client";

import React, { useEffect, useRef } from "react";
import { Lightbulb, ArrowRight, Zap, BookOpen, Target, Award } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { fadeIn, scaleIn } from "@/lib/animations";

interface RecommendationCardProps {
  title: string;
  description: string;
  actionText: string;
  reason?: string;
  priority?: "high" | "medium" | "low";
  icon?: React.ReactNode;
  onAction?: () => void;
  type?: "study" | "skill" | "career" | "quiz" | "project";
}

export function RecommendationCard({
  title,
  description,
  actionText,
  reason,
  priority = "medium",
  icon,
  onAction,
  type = "study",
}: RecommendationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      scaleIn(cardRef.current, { duration: 600, delay: 100 });
    }
  }, []);

  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "text-rose-400 bg-rose-950/60 border-rose-500/40";
      case "medium":
        return "text-amber-400 bg-amber-950/60 border-amber-500/40";
      case "low":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case "study":
        return <BookOpen className="w-4 h-4" />;
      case "skill":
        return <Target className="w-4 h-4" />;
      case "career":
        return <Award className="w-4 h-4" />;
      case "quiz":
        return <Zap className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <GlassCard
      title={title}
      subtitle="AI Recommendation"
      icon={icon || getTypeIcon()}
      className="relative overflow-hidden group"
    >
      <div className="space-y-3">
        {/* Priority Badge */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase border ${getPriorityColor()}`}>
            {priority} Priority
          </span>
          <span className="text-[10px] font-mono text-cyan-400">
            {type.toUpperCase()}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {description}
        </p>

        {/* Reason */}
        {reason && (
          <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-400">
                <span className="text-slate-300 font-semibold">Why:</span> {reason}
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={onAction}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          {actionText}
        </Button>
      </div>
    </GlassCard>
  );
}
