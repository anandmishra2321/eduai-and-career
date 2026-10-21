"use client";

import React, { useState, useEffect } from "react";
import { EduAIScrollExperience } from "@/components/cinematic/EduAIScrollExperience";
import { EduAIWorld } from "@/components/dashboard/EduAIWorld";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [hasEnteredWorkspace, setHasEnteredWorkspace] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setHasEnteredWorkspace(true);
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center font-mono text-cyan-400">
        <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-4" />
        <div className="text-xs uppercase tracking-widest">INITIALIZING EDUAI OS...</div>
      </div>
    );
  }

  if (hasEnteredWorkspace) {
    return (
      <EduAIWorld
        onLogout={() => {
          setHasEnteredWorkspace(false);
        }}
      />
    );
  }

  return (
    <EduAIScrollExperience
      onEnterApp={() => {
        setHasEnteredWorkspace(true);
      }}
    />
  );
}

