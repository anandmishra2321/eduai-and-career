"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
      md: "px-5 py-2.5 text-sm rounded-xl gap-2",
      lg: "px-7 py-3.5 text-base rounded-2xl gap-3 font-semibold",
    };

    const variantClasses = {
      primary:
        "bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:brightness-110 active:scale-[0.98] border border-cyan-300/40",
      ghost:
        "bg-cyan-950/20 text-cyan-300 hover:text-white border border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/15 backdrop-blur-md active:scale-[0.98]",
      gold:
        "bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:brightness-110 active:scale-[0.98] border border-yellow-300/40",
      danger:
        "bg-gradient-to-r from-red-600 to-rose-700 text-white font-medium hover:brightness-110 active:scale-[0.98] border border-red-400/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-200 outline-none select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-wide",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

