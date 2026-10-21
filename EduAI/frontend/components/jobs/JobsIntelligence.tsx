"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Briefcase,
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Search,
  Building2,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { progressBar, counterAnimation, fadeIn } from "@/lib/animations";
import { api } from "@/lib/api";

interface JobSkill {
  name: string;
  status: "matched" | "missing" | "partial";
}

interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  matchScore: number;
  skills: JobSkill[];
  description: string;
  requirements: string[];
  posted: string;
  applyUrl: string | null;
}

function safeJobUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function JobsIntelligence() {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setJobs([]);
      setSelectedJob(null);
      setError("");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setError("");
      setSelectedJob(null);
      void api.jobs.search(query)
        .then(({ jobs: results }) => {
          if (cancelled) return;
          const mapped: JobOpportunity[] = results.map((job) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            type: "Not provided by the job service",
            salary: job.salary_estimate || "Not provided",
            matchScore: job.match_percentage,
            skills: [
              ...job.matched_skills.map((name) => ({ name, status: "matched" as const })),
              ...job.missing_skills.map((name) => ({ name, status: "missing" as const })),
            ],
            description: "Description not provided by the job service.",
            requirements: job.missing_skills,
            posted: "Not provided",
            applyUrl: safeJobUrl(job.apply_url),
          }));
          setJobs(mapped);
        })
        .catch((cause: unknown) => {
          if (!cancelled) setError(cause instanceof Error ? cause.message : "Job search failed.");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [searchQuery]);

  const getMatchColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 bg-emerald-950/60 border-emerald-500/40";
    if (score >= 70) return "text-cyan-400 bg-cyan-950/60 border-cyan-500/40";
    return "text-amber-400 bg-amber-950/60 border-amber-500/40";
  };

  const getSkillStatusIcon = (status: JobSkill["status"]) => {
    switch (status) {
      case "matched":
        return <CheckCircle className="w-3 h-3 text-emerald-400" />;
      case "partial":
        return <AlertTriangle className="w-3 h-3 text-amber-400" />;
      case "missing":
        return <XCircle className="w-3 h-3 text-rose-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Jobs List */}
      <GlassPanel glow="cyan" className="p-6 lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            Opportunities
          </h3>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-500/30">
            {jobs.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Search current jobs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search current jobs (2+ characters)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/50 border border-cyan-500/30 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none font-mono"
          />
        </div>

        {/* Job List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Loading opportunities...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-4 text-center">
              <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-mono">{error || (searchQuery.trim().length < 2 ? "Enter at least two characters to search." : "No results returned by the jobs API.")}</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedJob(job);
                  }
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedJob?.id === job.id
                    ? "bg-cyan-950/40 border-cyan-400/60"
                    : "bg-black/40 border-cyan-500/20 hover:border-cyan-400/40"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white truncate">{job.title}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" />
                      {job.company}
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getMatchColor(job.matchScore)}`}>
                    {job.matchScore}%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </span>
                  <span>•</span>
                  <span>{job.type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassPanel>

      {/* Job Details */}
      {selectedJob && (
        <GlassPanel glow="cyan" className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{selectedJob.title}</h2>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {selectedJob.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedJob.location}
                </span>
              </div>
            </div>
            <div className={`text-3xl font-extrabold font-mono px-4 py-2 rounded-xl border ${getMatchColor(selectedJob.matchScore)}`}>
              {selectedJob.matchScore}%
            </div>
          </div>

          {/* Job Meta */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
              <div className="text-xs font-mono text-slate-400 mb-1">TYPE</div>
              <div className="text-sm font-semibold text-white">{selectedJob.type}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
              <div className="text-xs font-mono text-slate-400 mb-1">SALARY</div>
              <div className="text-sm font-semibold text-cyan-300">{selectedJob.salary}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
              <div className="text-xs font-mono text-slate-400 mb-1">POSTED</div>
              <div className="text-sm font-semibold text-white">{selectedJob.posted}</div>
            </div>
          </div>

          {/* Skill Match Analysis */}
          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-cyan-400 uppercase">Skill Match Analysis</span>
            </div>
            <div className="space-y-2">
              {selectedJob.skills.map((skill, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    {getSkillStatusIcon(skill.status)}
                    <span className="text-sm text-slate-300">{skill.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                    skill.status === "matched"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40"
                      : skill.status === "partial"
                      ? "bg-amber-950/60 text-amber-400 border border-amber-500/40"
                      : "bg-rose-950/60 text-rose-400 border border-rose-500/40"
                  }`}>
                    {skill.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <div className="text-xs font-mono text-slate-400 uppercase mb-2">Description</div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {selectedJob.description}
            </p>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <div className="text-xs font-mono text-slate-400 uppercase mb-2">Requirements</div>
            <div className="space-y-2">
              {selectedJob.requirements.map((req, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  {req}
                </div>
              ))}
            </div>
          </div>

          {selectedJob.applyUrl ? (
            <a href={selectedJob.applyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2">
              Apply Now <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-sm text-slate-400">Application link not provided. Saving jobs is not configured.</p>
          )}
        </GlassPanel>
      )}

      {!selectedJob && (
        <GlassPanel glow="cyan" className="p-6 lg:col-span-2 flex items-center justify-center">
          <div className="text-center">
            <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Select an Opportunity</h3>
            <p className="text-sm text-slate-400 font-mono">
              Choose a job from the list to view detailed match analysis
            </p>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
