"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Upload,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Search,
  Plus,
  Sparkles,
  BookOpen,
  Zap,
  Clock,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  citations?: Array<{ source: string; excerpt: string }>;
  toolUsed?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
}

export function AgentView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === "hi" ? "hi-IN" : "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          handleSubmit(new Event("submit") as any);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          size: file.size,
          content: reader.result as string,
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && uploadedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    // Create new conversation if none exists
    if (!currentConversation) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: input.slice(0, 30) || "New Conversation",
        messages: [userMessage],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentConversation(newConversation);
      setConversations((prev) => [newConversation, ...prev]);
    } else {
      setCurrentConversation((prev) => ({
        ...prev!,
        messages: [...prev!.messages, userMessage],
        updatedAt: new Date(),
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversation.id
            ? { ...c, messages: [...c.messages, userMessage], updatedAt: new Date() }
            : c
        )
      );
    }

    setInput("");
    setUploadedFiles([]);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockResponse(input, language),
        timestamp: new Date(),
        citations: [
          {
            source: "Study Notes - Chapter 3",
            excerpt: "Machine learning algorithms can be categorized into supervised, unsupervised, and reinforcement learning.",
          },
        ],
        toolUsed: "RAG",
      };

      setCurrentConversation((prev) => ({
        ...prev!,
        messages: [...prev!.messages, assistantMessage],
        updatedAt: new Date(),
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConversation.id
            ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date() }
            : c
        )
      );
    }, 1000);
  };

  const generateMockResponse = (prompt: string, lang: "en" | "hi"): string => {
    if (lang === "hi") {
      return "मैं आपकी मदद कर सकता हूं। कृपया बताएं कि आप क्या सीखना चाहते हैं। मैं आपको विषयों की व्याख्या, उदाहरण और अभ्यास प्रदान कर सकता हूं।";
    }
    return "I can help you with that! Based on your question, I've analyzed the relevant study materials. Here's what I found:\n\nThe key concept here involves understanding the fundamental principles. Let me break this down into simpler terms:\n\n1. First, we need to establish the basic framework\n2. Then, we can explore the practical applications\n3. Finally, we'll look at real-world examples\n\nWould you like me to elaborate on any specific aspect?";
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setInput("");
    setUploadedFiles([]);
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversation?.id === id) {
      setCurrentConversation(null);
    }
  };

  const exportConversation = (conversation: Conversation) => {
    const exportData = {
      title: conversation.title,
      createdAt: conversation.createdAt,
      messages: conversation.messages,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${conversation.title}.json`;
    a.click();
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)]">
      {/* Sidebar - Conversation History */}
      <aside className="hidden w-72 flex-col border-r bg-background/50 backdrop-blur-xl md:flex">
        <div className="p-4 border-b">
          <button
            onClick={startNewConversation}
            className="flex w-full items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Conversation
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-background/50 pl-10 pr-4 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setCurrentConversation(conversation)}
                className={`group flex items-center gap-2 rounded-lg p-3 cursor-pointer transition-colors ${
                  currentConversation?.id === conversation.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{conversation.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {conversation.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportConversation(conversation);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-all"
                >
                  <Download className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-all text-rose-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b bg-background/50 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">EduAI Assistant</h1>
              <p className="text-xs text-muted-foreground">
                {currentConversation?.title || "Start a new conversation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Zap className="h-4 w-4" />
              {language === "en" ? "EN" : "HI"}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentConversation ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles className="h-16 w-16 text-primary mb-4 animate-pulse" />
              <h2 className="text-2xl font-semibold mb-2">Welcome to EduAI Assistant</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Your personal AI learning companion. Ask questions, upload documents, and get personalized help with your studies.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                {[
                  { icon: <BookOpen />, text: "Explain concepts" },
                  { icon: <Zap />, text: "Generate quizzes" },
                  { icon: <FileText />, text: "Analyze documents" },
                  { icon: <ImageIcon />, text: "Visual learning" },
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion.text)}
                    className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
                  >
                    <div className="text-primary">{suggestion.icon}</div>
                    <span className="text-sm">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              <AnimatePresence>
                {currentConversation.messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-accent text-foreground"
                          : "bg-background/80 border text-foreground"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      {message.citations && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            Sources
                          </div>
                          {message.citations.map((citation, i) => (
                            <div key={i} className="text-xs text-muted-foreground bg-background/50 rounded p-2 mb-1">
                              <div className="font-medium">{citation.source}</div>
                              <div className="mt-1">{citation.excerpt}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {message.toolUsed && (
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Used: {message.toolUsed}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {message.timestamp.toLocaleTimeString()}
                        {message.role === "assistant" && (
                          <button
                            onClick={() => speak(message.content)}
                            className="hover:text-foreground transition-colors"
                          >
                            {isSpeaking ? "Speaking..." : "🔊"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background/50 backdrop-blur-xl p-4">
          {uploadedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-1.5 text-sm"
                >
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() =>
                      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id))
                    }
                  >
                    <Trash2 className="h-3 w-3 hover:text-rose-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-accent transition-colors"
            >
              <Upload className="h-4 w-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                language === "hi"
                  ? "अपना प्रश्न यहाँ लिखें या बोलें..."
                  : "Type your question or speak..."
              }
              className="flex-1 rounded-lg border bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-accent"
            />

            <button
              type="button"
              onClick={toggleListening}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                isListening
                  ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
                  : "hover:bg-accent"
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <button
              type="submit"
              disabled={!input.trim() && uploadedFiles.length === 0}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
