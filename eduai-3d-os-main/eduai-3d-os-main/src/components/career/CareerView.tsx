"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  TrendingUp,
  GraduationCap,
  FileText,
  MessageSquare,
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Sparkles,
  Brain,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Plus,
  X,
} from "lucide-react";
import { motion } from "motion/react";

interface CareerPath {
  id: string;
  title: string;
  matchScore: number;
  description: string;
  skills: string[];
  salaryRange: string;
  growthRate: number;
  companies: string[];
}

interface Skill {
  name: string;
  category: string;
  proficiency: number;
  demand: "high" | "medium" | "low";
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  posted: string;
  matchScore: number;
  description: string;
  requirements: string[];
}

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  answer: string;
}

const CAREER_PATHS: CareerPath[] = [
  {
    id: "1",
    title: "Machine Learning Engineer",
    matchScore: 92,
    description: "Design and implement ML systems and algorithms",
    skills: ["Python", "TensorFlow", "PyTorch", "Statistics", "Deep Learning"],
    salaryRange: "$120K - $200K",
    growthRate: 35,
    companies: ["Google", "Meta", "OpenAI", "Anthropic"],
  },
  {
    id: "2",
    title: "Data Scientist",
    matchScore: 88,
    description: "Analyze complex data to drive business decisions",
    skills: ["Python", "R", "SQL", "Statistics", "Data Visualization"],
    salaryRange: "$100K - $180K",
    growthRate: 28,
    companies: ["Amazon", "Microsoft", "Netflix", "Spotify"],
  },
  {
    id: "3",
    title: "Full Stack Developer",
    matchScore: 85,
    description: "Build end-to-end web applications",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
    salaryRange: "$90K - $160K",
    growthRate: 22,
    companies: ["Stripe", "Shopify", "Vercel", "Airbnb"],
  },
];

const SKILLS: Skill[] = [
  { name: "Python", category: "Programming", proficiency: 85, demand: "high" },
  { name: "JavaScript", category: "Programming", proficiency: 78, demand: "high" },
  { name: "Machine Learning", category: "AI/ML", proficiency: 72, demand: "high" },
  { name: "Data Analysis", category: "Data", proficiency: 80, demand: "high" },
  { name: "SQL", category: "Database", proficiency: 75, demand: "medium" },
  { name: "React", category: "Frontend", proficiency: 70, demand: "high" },
  { name: "Node.js", category: "Backend", proficiency: 65, demand: "medium" },
  { name: "AWS", category: "Cloud", proficiency: 60, demand: "high" },
];

const JOBS: Job[] = [
  {
    id: "1",
    title: "Senior ML Engineer",
    company: "TechCorp",
    location: "San Francisco, CA",
    salary: "$150K - $200K",
    type: "full-time",
    posted: "2 days ago",
    matchScore: 94,
    description: "Build and deploy ML models at scale",
    requirements: ["5+ years ML experience", "Python expertise", "TensorFlow/PyTorch"],
  },
  {
    id: "2",
    title: "Data Scientist",
    company: "DataFlow",
    location: "New York, NY",
    salary: "$120K - $160K",
    type: "full-time",
    posted: "1 week ago",
    matchScore: 89,
    description: "Analyze user behavior and build predictive models",
    requirements: ["3+ years experience", "SQL proficiency", "Statistics background"],
  },
  {
    id: "3",
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "Remote",
    salary: "$100K - $140K",
    type: "remote",
    posted: "3 days ago",
    matchScore: 82,
    description: "Build modern web applications",
    requirements: ["React/Next.js", "Node.js", "TypeScript"],
  },
];

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: "1",
    question: "Explain the difference between supervised and unsupervised learning",
    category: "Machine Learning",
    difficulty: "easy",
    answer: "Supervised learning uses labeled data to train models, while unsupervised learning finds patterns in unlabeled data without predefined outputs.",
  },
  {
    id: "2",
    question: "How do you handle overfitting in a neural network?",
    category: "Deep Learning",
    difficulty: "medium",
    answer: "Techniques include dropout, regularization, early stopping, data augmentation, and using more training data.",
  },
  {
    id: "3",
    question: "Design a system to recommend products to users",
    category: "System Design",
    difficulty: "hard",
    answer: "Use collaborative filtering, content-based filtering, or hybrid approaches. Consider scalability, cold-start problem, and real-time updates.",
  },
];

export function CareerView() {
  const [activeTab, setActiveTab] = useState<"paths" | "skills" | "resume" | "interview" | "jobs">("paths");
  const [selectedCareer, setSelectedCareer] = useState<CareerPath | null>(null);
  const [resumeContent, setResumeContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewMode, setInterviewMode] = useState<"practice" | "review">("practice");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [jobSearch, setJobSearch] = useState("");

  const analyzeResume = async () => {
    setIsAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 75) return "text-cyan-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const getDemandBadge = (demand: string) => {
    switch (demand) {
      case "high":
        return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-950/40 text-emerald-400 border border-emerald-500/40">High Demand</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-950/40 text-amber-400 border border-amber-500/40">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-rose-950/40 text-rose-400 border border-rose-500/40">Low</span>;
    }
  };

  const filteredJobs = JOBS.filter(
    (job) =>
      job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      job.company.toLowerCase().includes(jobSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Career Intelligence</h1>
            <p className="text-muted-foreground">AI-powered career guidance and job matching</p>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by CatBoost ML Model</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-4 overflow-x-auto">
          {(["paths", "skills", "resume", "interview", "jobs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Career Paths Tab */}
        {activeTab === "paths" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {CAREER_PATHS.map((path) => (
                <motion.div
                  key={path.id}
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-lg p-5 cursor-pointer border hover:border-accent transition-all"
                  onClick={() => setSelectedCareer(path)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{path.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{path.description}</p>
                    </div>
                    <div className={`text-2xl font-bold ${getMatchScoreColor(path.matchScore)}`}>
                      {path.matchScore}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    {path.salaryRange}
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {path.growthRate}% growth rate
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {path.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="text-xs px-2 py-0.5 rounded bg-accent/30">
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {selectedCareer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedCareer.title}</h2>
                    <p className="text-muted-foreground">{selectedCareer.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCareer(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-xs text-muted-foreground mb-1">Match Score</div>
                    <div className={`text-2xl font-bold ${getMatchScoreColor(selectedCareer.matchScore)}`}>
                      {selectedCareer.matchScore}%
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-xs text-muted-foreground mb-1">Salary Range</div>
                    <div className="text-lg font-semibold">{selectedCareer.salaryRange}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="text-xs text-muted-foreground mb-1">Growth Rate</div>
                    <div className="text-lg font-semibold text-emerald-400">
                      {selectedCareer.growthRate}%
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCareer.skills.map((skill) => (
                        <span key={skill} className="px-3 py-1.5 rounded-lg bg-accent text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Top Companies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCareer.companies.map((company) => (
                        <span key={company} className="px-3 py-1.5 rounded-lg bg-accent text-sm">
                          {company}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === "skills" && (
          <div className="space-y-6">
            <div className="glass rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Skills Analysis
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {SKILLS.map((skill) => (
                  <div key={skill.name} className="p-4 rounded-lg bg-accent/30 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-xs text-muted-foreground">{skill.category}</span>
                      </div>
                      {getDemandBadge(skill.demand)}
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Proficiency</span>
                        <span>{skill.proficiency}%</span>
                      </div>
                      <div className="w-full bg-background/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            skill.proficiency >= 80
                              ? "bg-emerald-400"
                              : skill.proficiency >= 60
                              ? "bg-cyan-400"
                              : "bg-amber-400"
                          }`}
                          style={{ width: `${skill.proficiency}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Recommendations
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-emerald-300">Focus on Machine Learning</div>
                    <div className="text-sm text-muted-foreground">
                      Your Python proficiency (85%) makes ML a natural next step. High demand in the market.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/40 border border-amber-500/40">
                  <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-amber-300">Improve Cloud Skills</div>
                    <div className="text-sm text-muted-foreground">
                      AWS proficiency at 60% - consider getting certified to increase job opportunities.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resume Tab */}
        {activeTab === "resume" && (
          <div className="space-y-6">
            <div className="glass rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Resume Intelligence
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <label className="flex-1">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-accent transition-all cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload your resume (PDF, DOCX)</p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium">Or paste resume content</label>
                  <textarea
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    placeholder="Paste your resume content here..."
                    rows={10}
                    className="w-full rounded-lg border bg-background/50 px-4 py-3 outline-none focus:border-accent resize-none"
                  />
                </div>

                <button
                  onClick={analyzeResume}
                  disabled={isAnalyzing || !resumeContent}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                >
                  <Sparkles className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
                  {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
                </button>
              </div>
            </div>

            {resumeContent && (
              <div className="glass rounded-lg p-6">
                <h3 className="font-semibold mb-4">ATS Optimization Score</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-accent/30 text-center">
                    <div className="text-3xl font-bold text-emerald-400">87%</div>
                    <div className="text-xs text-muted-foreground">Overall Score</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 text-center">
                    <div className="text-3xl font-bold text-cyan-400">92%</div>
                    <div className="text-xs text-muted-foreground">Keywords Match</div>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/30 text-center">
                    <div className="text-3xl font-bold text-amber-400">78%</div>
                    <div className="text-xs text-muted-foreground">Formatting</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interview Tab */}
        {activeTab === "interview" && (
          <div className="space-y-6">
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setInterviewMode("practice")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  interviewMode === "practice" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                Practice Mode
              </button>
              <button
                onClick={() => setInterviewMode("review")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  interviewMode === "review" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                }`}
              >
                Review Questions
              </button>
            </div>

            {interviewMode === "practice" ? (
              <div className="glass rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Interview Practice
                </h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-background/50">
                        {INTERVIEW_QUESTIONS[currentQuestion].category}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-background/50 capitalize">
                        {INTERVIEW_QUESTIONS[currentQuestion].difficulty}
                      </span>
                    </div>
                    <p className="font-medium">{INTERVIEW_QUESTIONS[currentQuestion].question}</p>
                  </div>

                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={6}
                    className="w-full rounded-lg border bg-background/50 px-4 py-3 outline-none focus:border-accent resize-none"
                  />

                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground">
                      Submit Answer
                    </button>
                    <button
                      onClick={() => {
                        setCurrentQuestion((prev) => (prev + 1) % INTERVIEW_QUESTIONS.length);
                        setUserAnswer("");
                      }}
                      className="px-4 py-2 rounded-lg border"
                    >
                      Next Question
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Question Bank
                </h2>
                <div className="space-y-3">
                  {INTERVIEW_QUESTIONS.map((q, index) => (
                    <div key={q.id} className="p-4 rounded-lg bg-accent/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-background/50">{q.category}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-background/50 capitalize">{q.difficulty}</span>
                      </div>
                      <p className="font-medium mb-2">{q.question}</p>
                      <p className="text-sm text-muted-foreground">{q.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  placeholder="Search jobs by title or company..."
                  className="w-full rounded-lg border bg-background/50 pl-10 pr-4 py-2.5 outline-none focus:border-accent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border">
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>

            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="glass rounded-lg p-5 hover:border-accent transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{job.title}</h3>
                        <span className={`text-sm font-bold ${getMatchScoreColor(job.matchScore)}`}>
                          {job.matchScore}% match
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-accent capitalize">{job.type}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{job.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-4 w-4" />
                        {job.salary}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {job.posted}
                      </span>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
