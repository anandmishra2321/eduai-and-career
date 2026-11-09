"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Upload,
  FileText,
  Sparkles,
  Download,
  MessageSquare,
  Brain,
  Layers,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { api } from "@/lib/api";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  status: "processing" | "indexed" | "error";
  uploadedAt: string;
  summary: string;
  keyConcepts: string[];
}

interface StudyStudioProps {
  onDocumentSelect?: (doc: Document) => void;
}

export function StudyStudio({ onDocumentSelect }: StudyStudioProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isSummarizingLocally, setIsSummarizingLocally] = useState(false);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [answer, setAnswer] = useState<{ answer: string; citations: Array<{ page: number; excerpt: string }> } | null>(null);
  const [answerLabel, setAnswerLabel] = useState("Document service response");
  const [flashcards, setFlashcards] = useState<Array<{ front: string; back: string }>>([]);
  const [error, setError] = useState("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    void handleFileUpload(files);
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files.length) return;
    setIsProcessing(true);
    setError("");
    for (const file of files) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx", "txt", "md"].includes(extension ?? "")) {
        setError(`${file.name}: choose a PDF, DOCX, TXT, or Markdown file.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name}: file size exceeds 10 MB.`);
        continue;
      }
      try {
        const summary = await api.learning.uploadDocument(file);
        if (!summary.id) throw new Error("The document service returned no identifier.");
        const doc: Document = {
          id: summary.id,
          name: summary.filename,
          type: summary.file_type,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          status: "indexed",
          uploadedAt: new Date().toLocaleString(),
          summary: summary.summary,
          keyConcepts: summary.key_concepts,
        };
        setDocuments((current) => [doc, ...current.filter((item) => item.id !== doc.id)]);
        setSelectedDoc(doc);
        setAnswer(null);
        setAnswerLabel("Document service response");
        setFlashcards([]);
        onDocumentSelect?.(doc);
      } catch (cause) {
        setError(`${file.name}: ${cause instanceof Error ? cause.message : "upload failed."}`);
      }
    }
    setIsProcessing(false);
  };

  const handleAsk = async () => {
    const question = query.trim();
    if (!selectedDoc) {
      setError("Upload and select a document before asking a question.");
      return;
    }
    if (question.length < 2) {
      setError("Enter a question with at least two characters.");
      return;
    }
    setIsAsking(true);
    setError("");
    setAnswer(null);
    setAnswerLabel("Document service response");
    try {
      setAnswer(await api.learning.askDocument(selectedDoc.id, question));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Document question failed.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleAskWithAI = async () => {
    const question = query.trim();
    if (!selectedDoc) {
      setError("Upload and select a document before asking a question.");
      return;
    }
    if (question.length < 2) {
      setError("Enter a question with at least two characters.");
      return;
    }
    setIsAsking(true);
    setError("");
    setAnswer(null);
    try {
      const result = await api.learning.askDocumentWithAI(selectedDoc.id, question);
      setAnswer(result);
      setAnswerLabel(`AI answer · ${result.provider} · ${result.model}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AI document question failed.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleLocalSummarize = async () => {
    if (!selectedDoc) {
      setError("Upload and select a document before generating a summary.");
      return;
    }
    setIsSummarizingLocally(true);
    setError("");
    try {
      const result = await api.learning.summarizeDocument(selectedDoc.id);
      const updatedDoc = { ...selectedDoc, summary: result.summary };
      setSelectedDoc(updatedDoc);
      setDocuments((current) => current.map((doc) => doc.id === updatedDoc.id ? updatedDoc : doc));
      setAnswer({ answer: result.summary, citations: [] });
      setAnswerLabel(`Local summary · ${result.model}`);
      onDocumentSelect?.(updatedDoc);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Local document summary failed.");
    } finally {
      setIsSummarizingLocally(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedDoc) {
      setError("Upload and select a document before generating flashcards.");
      return;
    }
    setIsLoadingFlashcards(true);
    setError("");
    try {
      const result = await api.learning.generateFlashcards(selectedDoc.id);
      setFlashcards(result.flashcards);
      if (result.flashcards.length === 0) setError("The service returned no flashcards.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Flashcard generation failed.");
    } finally {
      setIsLoadingFlashcards(false);
    }
  };

  const exportNotes = () => {
    if (!selectedDoc) {
      setError("Select a document before exporting its notes.");
      return;
    }
    const contents = [
      `# ${selectedDoc.name}`,
      "",
      "## Summary",
      selectedDoc.summary || "No summary returned.",
      "",
      "## Key concepts",
      ...selectedDoc.keyConcepts.map((concept) => `- ${concept}`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([contents], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedDoc.name.replace(/\.[^.]+$/, "")}-notes.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: Document["status"]) => {
    switch (status) {
      case "indexed":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "processing":
        return <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />;
      case "error":
        return <XCircle className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Upload Zone */}
      <GlassPanel glow="cyan" className="p-6">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Material Vault
        </h3>
        <p className="text-xs text-slate-400 font-mono mb-4">
          Upload PDFs and DOCX files to the connected study API (maximum 20 MB each).
        </p>

        <label
          htmlFor="file-upload"
          aria-label="Choose study documents or drop files here"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${
            isDragging
              ? "border-cyan-400 bg-cyan-950/30"
              : "border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/20"
          }`}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.docx"
            className="sr-only"
            onChange={(event) => {
              void handleFileUpload(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
            <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-200">
              {isProcessing ? "Uploading…" : "Drop study materials here"}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Select files or drag and drop
            </div>
        </label>
        {error && <p role="alert" className="mb-3 text-sm text-rose-300">{error}</p>}

        {/* Document List */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-slate-400 uppercase mb-2">
            Indexed Documents ({documents.length})
          </div>
          {documents.map((doc) => (
            <button
              type="button"
              key={doc.id}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedDoc?.id === doc.id
                  ? "bg-cyan-950/40 border-cyan-400/60"
                  : "bg-black/40 border-cyan-500/20 hover:border-cyan-400/40"
              }`}
              onClick={() => {
                setSelectedDoc(doc);
                setAnswer(null);
                setFlashcards([]);
                onDocumentSelect?.(doc);
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white truncate flex-1">
                  {doc.name}
                </span>
                {getStatusIcon(doc.status)}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{doc.type} • {doc.size}</span>
                <span>{doc.uploadedAt}</span>
              </div>
            </button>
          ))}
          {documents.length === 0 && <p className="text-sm text-slate-500">Documents you upload will appear here.</p>}
        </div>
      </GlassPanel>

      {/* RAG Query Interface */}
      <GlassPanel glow="cyan" className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-cyan-400" />
            AI RAG Query Engine
          </h3>
          {selectedDoc && (
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-500/30">
              {selectedDoc.name}
            </span>
          )}
        </div>

        {/* Query Input */}
        <form className="mb-4" onSubmit={(event) => { event.preventDefault(); void handleAsk(); }}>
          <div className="relative">
            <input
              aria-label="Ask a question about the selected document"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!selectedDoc || isAsking}
              placeholder="Ask anything about your documents..."
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-cyan-500/30 text-white placeholder-slate-500 text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-mono pr-12"
            />
            <button type="submit" disabled={!selectedDoc || isAsking || query.trim().length < 2} aria-label="Ask document question" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-cyan-700 p-2 text-white disabled:opacity-50">
              {isAsking ? <span className="text-xs">…</span> : <Sparkles className="h-4 w-4" />}
            </button>
          </div>
        </form>

        {/* Available API-backed actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {[
            { label: "View summary", icon: <Brain className="h-4 w-4" />, action: () => setAnswer(selectedDoc ? { answer: selectedDoc.summary || "No summary returned by the document service.", citations: [] } : null), disabled: !selectedDoc },
            { label: "Ask question", icon: <MessageSquare className="h-4 w-4" />, action: () => void handleAsk(), disabled: !selectedDoc || query.trim().length < 2 || isAsking },
            { label: "Ask with AI", icon: <Sparkles className="h-4 w-4" />, action: () => void handleAskWithAI(), disabled: !selectedDoc || query.trim().length < 2 || isAsking },
            { label: "Summarize locally", icon: <Brain className="h-4 w-4" />, action: () => void handleLocalSummarize(), disabled: !selectedDoc || isSummarizingLocally },
            { label: "Create flashcards", icon: <Layers className="h-4 w-4" />, action: () => void handleGenerateFlashcards(), disabled: !selectedDoc || isLoadingFlashcards },
            { label: "Export notes", icon: <Download className="h-4 w-4" />, action: exportNotes, disabled: !selectedDoc },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              onClick={action.action}
              className="p-3 rounded-xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-950/30 transition-all flex flex-col items-center gap-2 group"
            >
              <div className="text-cyan-300">{action.icon}</div>
              <span className="text-[10px] font-mono text-slate-300 group-hover:text-white">
                {action.label === "Create flashcards" && isLoadingFlashcards
                  ? "Generating…"
                  : action.label === "Summarize locally" && isSummarizingLocally
                    ? "Summarizing…"
                    : action.label}
              </span>
            </button>
          ))}
        </div>

        {answer && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-cyan-400 uppercase">{answerLabel}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{answer.answer}</p>
              {answer.citations.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {answer.citations.map((citation, index) => (
                    <li key={`${citation.page}-${index}`} className="rounded-lg border border-cyan-500/20 p-3 text-xs text-slate-400">
                      <span className="font-semibold text-cyan-300">Page {citation.page}</span>
                      <p className="mt-1">{citation.excerpt}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {flashcards.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {flashcards.map((card, index) => (
              <details key={`${index}-${card.front}`} className="rounded-xl border border-cyan-500/20 bg-black/30 p-4">
                <summary className="cursor-pointer text-sm font-medium text-cyan-200">{card.front}</summary>
                <p className="mt-3 text-sm text-slate-300">{card.back}</p>
              </details>
            ))}
          </div>
        )}

        {!selectedDoc && (
          <div className="p-8 rounded-xl bg-black/40 border border-cyan-500/20 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-mono">
              Select a document to start querying
            </p>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
