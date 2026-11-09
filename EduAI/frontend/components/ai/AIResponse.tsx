"use client";

import React from "react";
import { CheckCircle, AlertCircle, Copy, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface AIResponseProps {
  content: string;
  confidence?: number;
  sources?: string[];
  onCopy?: () => void;
  onFeedback?: (positive: boolean) => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
}

export function AIResponse({
  content,
  confidence,
  sources,
  onCopy,
  onFeedback,
  onRegenerate,
  isLoading = false,
}: AIResponseProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    onCopy?.();
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-accent/50 rounded-2xl p-4 space-y-3"
    >
      {/* Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-foreground leading-relaxed">{content}</p>
      </div>

      {/* Confidence Indicator */}
      {confidence !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          {confidence >= 0.8 ? (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          ) : confidence >= 0.5 ? (
            <AlertCircle className="w-4 h-4 text-amber-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          <span className="text-muted-foreground">
            Confidence: {Math.round(confidence * 100)}%
          </span>
        </div>
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Sources:</p>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="Copy response"
        >
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
        {onFeedback && (
          <>
            <button
              onClick={() => onFeedback(true)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="Helpful"
            >
              <ThumbsUp className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => onFeedback(false)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="Not helpful"
            >
              <ThumbsDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            title="Regenerate"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
