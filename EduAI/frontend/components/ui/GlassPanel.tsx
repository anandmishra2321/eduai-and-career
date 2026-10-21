"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "cyan" | "gold";
  padding?: "none" | "sm" | "md" | "lg";
  rounded?: "none" | "md" | "lg" | "xl" | "2xl";
}

export function GlassPanel({
  children,
  className,
  glow = "cyan",
  padding = "md",
  rounded = "2xl",
  ...props
}: GlassPanelProps) {
  const paddingMap = {
    none: "p-0",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  const roundedMap = {
    none: "rounded-none",
    md: "rounded-lg",
    lg: "rounded-xl",
    xl: "rounded-2xl",
    "2xl": "rounded-3xl",
  };

  return (
    <div
      className={cn(
        "eduai-glass relative border transition-all duration-300",
        paddingMap[padding],
        roundedMap[rounded],
        className
      )}
      style={{
        borderColor: "var(--eduai-panel-border)",
        boxShadow: glow === "none"
          ? "var(--eduai-shadow-raised), var(--eduai-shadow-inset)"
          : `var(--eduai-shadow-raised), var(--eduai-shadow-inset), 0 0 25px color-mix(in srgb, ${glow === "gold" ? "#fbbf24" : "var(--eduai-accent)"} 12%, transparent)`,
      }}
      {...props}
    >
      {/* Subtle corner light accents */}
      <div className="pointer-events-none absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-2 border-t-2 border-[var(--eduai-accent)] opacity-40" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-2 border-r-2 border-[var(--eduai-accent)] opacity-40" />
      {children}
    </div>
  );
}

export function GlassCard({
  title,
  subtitle,
  icon,
  badge,
  children,
  className,
  onClick,
}: {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-panel glass-panel-hover rounded-2xl p-5 transition-all duration-300",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      {(title || icon || badge) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="eduai-icon rounded-xl border p-2.5">
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-slate-100 text-sm tracking-wide">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}
