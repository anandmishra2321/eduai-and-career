"use client";

import React, { useState } from "react";
import { Sparkles, BookOpen, Target, Brain, Lightbulb, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

interface AICommandBarProps {
  onCommand?: (command: string) => void;
  position?: "top" | "bottom";
}

export function AICommandBar({ onCommand, position = "bottom" }: AICommandBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const commands: Command[] = [
    {
      id: "explain-concept",
      label: "Explain Concept",
      description: "Get a detailed explanation of any topic",
      icon: <Lightbulb className="w-4 h-4" />,
      action: () => onCommand?.("explain"),
      category: "learning",
    },
    {
      id: "quiz-me",
      label: "Quiz Me",
      description: "Generate a quiz based on current topic",
      icon: <Brain className="w-4 h-4" />,
      action: () => onCommand?.("quiz"),
      category: "learning",
    },
    {
      id: "study-plan",
      label: "Create Study Plan",
      description: "Generate a personalized study schedule",
      icon: <Target className="w-4 h-4" />,
      action: () => onCommand?.("plan"),
      category: "planning",
    },
    {
      id: "summarize",
      label: "Summarize",
      description: "Get a summary of the current content",
      icon: <BookOpen className="w-4 h-4" />,
      action: () => onCommand?.("summarize"),
      category: "learning",
    },
    {
      id: "generate-ideas",
      label: "Generate Ideas",
      description: "Brainstorm ideas for projects or assignments",
      icon: <Sparkles className="w-4 h-4" />,
      action: () => onCommand?.("ideas"),
      category: "creative",
    },
  ];

  const categories = ["all", "learning", "planning", "creative"];
  const filteredCommands =
    selectedCategory === "all"
      ? commands
      : commands.filter((cmd) => cmd.category === selectedCategory);

  return (
    <div className={`fixed ${position === "top" ? "top-20" : "bottom-24"} left-1/2 -translate-x-1/2 z-50`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">AI Commands</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Command Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-2 w-80 bg-background border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Category Filter */}
            <div className="flex gap-1 p-2 border-b bg-accent/30">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Commands List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCommands.map((command) => (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-primary">
                    {command.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{command.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {command.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
