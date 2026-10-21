"use client";

import React, { useState, useRef } from "react";
import { Paperclip, Sparkles, ArrowRight } from "lucide-react";
import { VoiceButton, VoiceState } from "./VoiceButton";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  onExecutePrompt?: (prompt: string) => void;
  onUploadFile?: (file: File) => void;
  onVoiceStateChange?: (state: VoiceState) => void;
  className?: string;
  placeholder?: string;
}

export function CommandBar({
  onExecutePrompt,
  onUploadFile,
  onVoiceStateChange,
  className,
  placeholder = "Ask EduAI anything... (e.g., 'Analyze my performance', 'Make a quiz', 'Find skill gaps')",
}: CommandBarProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    onExecutePrompt?.(input.trim());
    setInput("");
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(text);
    onExecutePrompt?.(text);
  };

  const handleQuickCommand = (cmd: string) => {
    setInput(cmd);
    onExecutePrompt?.(cmd);
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-3xl transition-all duration-300",
        className
      )}
    >
      {/* Quick suggestions pills when focused */}
      {isFocused && (
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            "Analyze my performance",
            "Generate career roadmap",
            "Test my Python skills",
            "Explain this concept",
          ].map((cmd) => (
            <button
              key={cmd}
              type="button"
              onMouseDown={() => handleQuickCommand(cmd)}
              className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all flex items-center gap-1 backdrop-blur-md"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{cmd}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main glass pill bar */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex items-center gap-2 p-2 rounded-2xl backdrop-blur-2xl bg-[#060B18]/85 border transition-all duration-300 shadow-[0_12px_40px_0_rgba(0,0,0,0.6)]",
          isFocused
            ? "border-cyan-400/60 shadow-[0_0_35px_rgba(0,240,255,0.25)]"
            : "border-cyan-500/25 hover:border-cyan-400/40"
        )}
      >
        {/* Glow halo */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 rounded-2xl -z-10 pointer-events-none" />

        {/* Voice Trigger */}
        <VoiceButton
          onTranscript={handleVoiceTranscript}
          onStateChange={onVoiceStateChange}
        />

        {/* Input Field */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-400 text-sm md:text-base outline-none px-2 tracking-wide font-sans"
        />

        {onUploadFile && (
          <>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadFile(file);
                  e.currentTarget.value = "";
                }}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload document or study material"
                aria-label="Upload study document"
                className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-cyan-950/40 hover:text-cyan-300"
            >
                <Paperclip className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Submit / Send Button */}
        <button
          type="submit"
          disabled={!input.trim()}
          className={cn(
            "p-3 rounded-xl transition-all duration-200 flex items-center justify-center select-none",
            input.trim()
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-95 cursor-pointer"
              : "bg-slate-800/50 text-slate-500 cursor-not-allowed"
          )}
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
