"use client";

import React, { useState } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  Trash2,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { api } from "@/lib/api";

function SkillList({ title, skills }: { title: string; skills: string[] }) {
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-black/30 p-4">
      <h4 className="mb-3 text-xs font-mono uppercase text-slate-400">{title}</h4>
      {skills.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <li key={`${skill}-${index}`} className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-200">{skill}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No items returned.</p>
      )}
    </section>
  );
}

export function ResumeIntelligence() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof api.resume.analyze>> | null>(null);
  const [analysisError, setAnalysisError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(extension ?? "")) {
      setAnalysisError("Choose a PDF or DOCX file.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAnalysisError("Resume files must be 10 MB or smaller.");
      e.target.value = "";
      return;
    }

    setResumeFile(file);
    setAnalysis(null);
    setAnalysisError("");
    setIsAnalyzing(true);
    try {
      const result = await api.resume.analyze(file);
      if (!Number.isFinite(result.ats_score) || result.ats_score < 0 || result.ats_score > 100) {
        throw new Error("The resume service returned an invalid ATS score.");
      }
      setAnalysis(result);
    } catch (cause) {
      setAnalysisError(cause instanceof Error ? cause.message : "Resume analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Upload & Analysis Panel */}
      <GlassPanel glow="cyan" className="p-6">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Resume Analyzer
        </h3>
        <p className="text-xs text-slate-400 font-mono mb-4">
          Upload a PDF or DOCX to request analysis from the configured resume API. Files up to 10 MB.
        </p>

        {!resumeFile ? (
          <label
            htmlFor="resume-upload"
            className="block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-950/20 transition-all mb-4 focus-within:ring-2 focus-within:ring-cyan-300"
          >
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.docx"
              className="sr-only"
              onChange={handleFileUpload}
            />
            <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-200">
              Upload Resume
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              PDF or DOCX
            </div>
          </label>
        ) : (
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white truncate">
                {resumeFile.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setResumeFile(null);
                  setAnalysis(null);
                  setAnalysisError("");
                }}
                aria-label="Remove selected resume"
                className="p-1 rounded hover:bg-rose-950/60 text-rose-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {(resumeFile.size / 1024).toFixed(1)} KB
            </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
            <div className="w-8 h-8 mx-auto mb-2 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-mono">
              Analyzing resume structure...
            </p>
          </div>
        )}

        {analysisError && <p role="alert" className="text-sm text-rose-300">{analysisError}</p>}
      </GlassPanel>

      {/* Analysis Results */}
      {analysis && (
        <>
          <GlassPanel glow="cyan" className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Resume API results
              </h3>
              <span className="text-xs font-mono text-slate-400">API-returned data</span>
            </div>

            {/* Score Cards */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
                <div className="text-xs font-mono text-slate-400 mb-1">ATS SCORE</div>
                <div className={`text-3xl font-extrabold font-mono ${getScoreColor(analysis.ats_score)}`}>
                  {analysis.ats_score}
                </div>
                <div className="text-xs text-slate-400 mt-1">/ 100</div>
              </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <SkillList title="Detected skills" skills={analysis.detected_skills} />
              <SkillList title="Missing skills" skills={analysis.missing_skills} />
            </div>

            {/* Suggestions */}
            <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono text-cyan-400 uppercase">Service suggestions</span>
              </div>
              <div className="space-y-2">
                {analysis.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>

            {analysis.bullet_point_improvements.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-xs font-mono uppercase text-slate-400">Bullet point improvements from the service</h4>
                {analysis.bullet_point_improvements.map((improvement, index) => (
                  <article key={`${index}-${improvement.original}`} className="rounded-xl border border-cyan-500/20 bg-black/30 p-4">
                    <p className="text-xs text-slate-400">Original: {improvement.original}</p>
                    <p className="mt-2 text-sm text-white">Suggested: {improvement.improved}</p>
                    <p className="mt-1 text-xs text-slate-400">{improvement.reason}</p>
                  </article>
                ))}
              </div>
            )}
          </GlassPanel>
        </>
      )}
    </div>
  );
}
