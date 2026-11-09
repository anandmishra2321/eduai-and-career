"use client";

import React, { useEffect, useRef } from "react";
import { Compass, TrendingUp, DollarSign } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassPanel";
import { CareerRecommendation } from "@/types";
import { counterAnimation, progressBar } from "@/lib/animations";

interface CareerCardProps {
  career: CareerRecommendation;
  onClick?: () => void;
}

export function CareerCard({ career, onClick }: CareerCardProps) {
  const scoreRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scoreRef.current) {
      counterAnimation(scoreRef.current, 0, career.recommendation_score, { duration: 1500 });
    }

    if (progressRef.current) {
      progressBar(progressRef.current, career.recommendation_score / 100, { duration: 1200 });
    }
  }, [career.recommendation_score]);

  const getDemandColor = () => {
    switch (career.market_demand) {
      case "Very High":
        return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
      case "High":
        return "text-cyan-400 bg-cyan-950/60 border-cyan-500/40";
      case "Emerging":
        return "text-amber-400 bg-amber-950/60 border-amber-500/40";
      default:
        return "text-slate-400 bg-slate-950/60 border-slate-500/40";
    }
  };

  return (
    <GlassCard
      title={career.career_title}
      subtitle={career.category}
      icon={<Compass className="w-5 h-5" />}
      className="cursor-pointer hover:border-cyan-400/50 transition-all group"
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Recommendation Score */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 mb-1">MATCH SCORE</div>
            <div ref={scoreRef} className="text-3xl font-extrabold font-mono text-amber-300">
              {career.recommendation_score}%
            </div>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">AI fit estimate</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            ref={progressRef}
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
            style={{ transform: "scaleX(0)", transformOrigin: "left" }}
          />
        </div>

        {/* Roadmap Summary */}
        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
          <p className="mb-2 text-xs text-slate-300">{career.fit_reason}</p>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {career.roadmap_summary}
          </p>
        </div>

        {/* Key Prerequisites */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-400 uppercase">Prerequisites</div>
          <div className="flex flex-wrap gap-1.5">
            {career.key_prerequisites.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-200 text-[11px] font-mono"
              >
                {skill}
              </span>
            ))}
            {career.key_prerequisites.length > 4 && (
              <span className="px-2 py-0.5 rounded bg-slate-950/60 border border-slate-500/30 text-slate-400 text-[11px] font-mono">
                +{career.key_prerequisites.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Market Info */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <div className="text-[10px] font-mono text-slate-400">Demand</div>
              <div className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded border ${getDemandColor()}`}>
                {career.market_demand}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <div className="text-[10px] font-mono text-slate-400">Salary</div>
              <div className="text-[11px] font-mono text-cyan-300 truncate">
                {career.median_salary_range}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
