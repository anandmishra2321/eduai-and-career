"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type VoiceState = "IDLE" | "LISTENING" | "PROCESSING" | "RESPONDING" | "UNAVAILABLE";

interface SpeechRecognitionResultEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface VoiceButtonProps {
  onTranscript?: (text: string) => void;
  onStateChange?: (state: VoiceState) => void;
  lang?: "en-US" | "hi-IN";
  className?: string;
}

export function VoiceButton({
  onTranscript,
  onStateChange,
  lang = "en-US",
  className,
}: VoiceButtonProps) {
  const [state, setState] = useState<VoiceState>("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stateRef = useRef(state);
  const transcriptHandlerRef = useRef(onTranscript);
  const stateHandlerRef = useRef(onStateChange);
  transcriptHandlerRef.current = onTranscript;
  stateHandlerRef.current = onStateChange;

  const updateState = useCallback((newState: VoiceState) => {
    stateRef.current = newState;
    setState(newState);
    stateHandlerRef.current?.(newState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check browser speech recognition API support
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition is not supported. Type your prompt instead.");
      updateState("UNAVAILABLE");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang;

      recognition.onstart = () => {
        setErrorMessage(null);
        updateState("LISTENING");
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          updateState("PROCESSING");
          transcriptHandlerRef.current?.(transcript);
          setTimeout(() => {
            updateState("IDLE");
          }, 1200);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone permission denied.");
        } else {
          setErrorMessage("Speech recognition paused or error.");
        }
        updateState("IDLE");
      };

      recognition.onend = () => {
        if (stateRef.current === "LISTENING") {
          updateState("IDLE");
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Speech init failure:", err);
      updateState("UNAVAILABLE");
    }

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, [lang, updateState]);

  const toggleListening = () => {
    if (state === "UNAVAILABLE") {
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (state === "LISTENING") {
      recognition.stop();
      updateState("IDLE");
    } else if (state === "IDLE") {
      try {
        recognition.start();
      } catch (err) {
        console.warn("Speech start retry:", err);
      }
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={state === "UNAVAILABLE"}
        aria-label={state === "LISTENING" ? "Stop voice input" : "Start voice input"}
        aria-describedby={errorMessage ? "voice-button-error" : undefined}
        onClick={toggleListening}
        title={
          state === "UNAVAILABLE"
            ? "Voice recognition unsupported"
            : state === "LISTENING"
            ? "Click to stop listening"
            : "Click to speak to EduAI"
        }
        className={cn(
          "relative p-3 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer select-none",
          state === "IDLE" &&
            "bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]",
          state === "LISTENING" &&
            "bg-red-950/60 text-red-400 border border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.6)] animate-pulse",
          state === "PROCESSING" &&
            "bg-cyan-900/60 text-cyan-300 border border-cyan-400/80 shadow-[0_0_25px_rgba(0,240,255,0.6)]",
          state === "RESPONDING" &&
            "bg-emerald-950/60 text-emerald-400 border border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.6)]",
          state === "UNAVAILABLE" &&
            "bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed",
          className
        )}
      >
        {/* Pulsing ring indicator while listening */}
        {state === "LISTENING" && (
          <span className="absolute -inset-1 rounded-full border border-red-500/60 animate-ping pointer-events-none" />
        )}

        {state === "IDLE" && <Mic className="w-5 h-5" />}
        {state === "LISTENING" && <Mic className="w-5 h-5 animate-bounce" />}
        {state === "PROCESSING" && <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />}
        {state === "RESPONDING" && <Volume2 className="w-5 h-5 animate-pulse text-emerald-400" />}
        {state === "UNAVAILABLE" && <MicOff className="w-5 h-5 text-slate-500" />}
      </button>

      {errorMessage && (
        <div id="voice-button-error" role="status" className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-950/90 border border-red-500/50 text-red-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-lg backdrop-blur-md">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
