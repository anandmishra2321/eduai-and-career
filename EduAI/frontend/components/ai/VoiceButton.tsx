"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { motion } from "motion/react";

interface VoiceButtonProps {
  onTranscript?: (transcript: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  language?: string;
  disabled?: boolean;
}

export function VoiceButton({
  onTranscript,
  onSpeechStart,
  onSpeechEnd,
  language = "en-US",
  disabled = false,
}: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        onSpeechStart?.();
      };

      recognition.onend = () => {
        setIsListening(false);
        onSpeechEnd?.();
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript);

        if (finalTranscript) {
          onTranscript?.(finalTranscript);
          setTranscript("");
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onSpeechStart, onSpeechEnd, onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-2 rounded-lg bg-muted opacity-50 cursor-not-allowed"
        title="Speech recognition not supported in this browser"
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={toggleListening}
        disabled={disabled}
        className={`p-2 rounded-lg transition-all ${
          isListening
            ? "bg-rose-500 text-white animate-pulse"
            : "hover:bg-accent"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        whileTap={{ scale: 0.95 }}
        title={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </motion.button>

      {/* Audio Wave Animation */}
      {isListening && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-end gap-0.5 h-6">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-rose-500 rounded-full"
              initial={{ height: 4 }}
              animate={{
                height: [4, 20, 4],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}

      {/* Transcript Preview */}
      {transcript && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-background border shadow-lg max-w-xs">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm">{transcript}</span>
          </div>
        </div>
      )}
    </div>
  );
}
