"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  FileText,
  Sparkles,
  Brain,
  Layers,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  nextReview: Date;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  children: MindMapNode[];
}

export function StudyView() {
  const [activeTab, setActiveTab] = useState<"notes" | "flashcards" | "mindmap">("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studySession, setStudySession] = useState<{ due: Flashcard[]; reviewed: number; correct: number }>({
    due: [],
    reviewed: 0,
    correct: 0,
  });

  // Notes state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Flashcard state
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");

  // Mind map state
  const [mindMap, setMindMap] = useState<MindMapNode>({
    id: "root",
    text: "Central Topic",
    x: 400,
    y: 300,
    children: [],
  });
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  useEffect(() => {
    // Load from localStorage
    try {
      const savedNotes = localStorage.getItem("eduai-notes");
      if (savedNotes) setNotes(JSON.parse(savedNotes));

      const savedFlashcards = localStorage.getItem("eduai-flashcards");
      if (savedFlashcards) setFlashcards(JSON.parse(savedFlashcards));

      const savedMindMap = localStorage.getItem("eduai-mindmap");
      if (savedMindMap) setMindMap(JSON.parse(savedMindMap));
    } catch {
      // Ignore errors
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("eduai-notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("eduai-flashcards", JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem("eduai-mindmap", JSON.stringify(mindMap));
  }, [mindMap]);

  // Leitner Spaced Repetition Algorithm
  const calculateNextReview = (card: Flashcard, quality: number): Flashcard => {
    let { interval, repetitions, easeFactor } = card;

    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions++;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
      ...card,
      interval,
      repetitions,
      easeFactor,
      nextReview,
    };
  };

  const startStudySession = () => {
    const now = new Date();
    const dueCards = flashcards.filter((card) => card.nextReview <= now);
    setStudySession({
      due: dueCards,
      reviewed: 0,
      correct: 0,
    });
    if (dueCards.length > 0) {
      setCurrentCard(dueCards[0]);
      setIsFlipped(false);
    }
  };

  const handleCardResponse = (quality: number) => {
    if (!currentCard) return;

    const updatedCard = calculateNextReview(currentCard, quality);
    setFlashcards((prev) => prev.map((c) => (c.id === currentCard.id ? updatedCard : c)));

    const isCorrect = quality >= 3;
    setStudySession((prev) => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
    }));

    // Move to next card
    const remainingCards = studySession.due.filter((c) => c.id !== currentCard.id);
    if (remainingCards.length > 0) {
      setCurrentCard(remainingCards[0]);
      setIsFlipped(false);
    } else {
      setCurrentCard(null);
    }
  };

  const createNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: noteTitle,
      content: noteContent,
      tags: selectedTags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setNoteTitle("");
    setNoteContent("");
    setSelectedTags([]);
  };

  const createFlashcard = () => {
    if (!cardFront.trim() || !cardBack.trim()) return;

    const newCard: Flashcard = {
      id: Date.now().toString(),
      front: cardFront,
      back: cardBack,
      difficulty: 3,
      nextReview: new Date(),
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    };

    setFlashcards((prev) => [newCard, ...prev]);
    setCardFront("");
    setCardBack("");
  };

  const addMindMapNode = (parentId: string) => {
    const newNode: MindMapNode = {
      id: Date.now().toString(),
      text: "New Node",
      x: Math.random() * 600 + 100,
      y: Math.random() * 400 + 100,
      children: [],
    };

    const addToParent = (node: MindMapNode): MindMapNode => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, newNode] };
      }
      return {
        ...node,
        children: node.children.map(addChild),
      };
    };

    const addChild = (n: MindMapNode): MindMapNode => {
      if (n.id === parentId) {
        return { ...n, children: [...n.children, newNode] };
      }
      return {
        ...n,
        children: n.children.map(addChild),
      };
    };

    setMindMap(addToParent(mindMap));
  };

  const updateMindMapNode = (nodeId: string, text: string) => {
    const updateNode = (node: MindMapNode): MindMapNode => {
      if (node.id === nodeId) {
        return { ...node, text };
      }
      return {
        ...node,
        children: node.children.map(updateNode),
      };
    };

    setMindMap(updateNode(mindMap));
  };

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (selectedTags.length === 0 || selectedTags.some((tag) => note.tags.includes(tag)))
  );

  return (
    <div className="flex h-screen bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)]">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-col border-r bg-background/50 backdrop-blur-xl md:flex">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-4">Study Studio</h2>
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab("notes")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "notes" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <FileText className="h-4 w-4" />
              Notes
              <span className="ml-auto text-xs bg-background/50 px-2 py-0.5 rounded-full">{notes.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("flashcards")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "flashcards" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <Layers className="h-4 w-4" />
              Flashcards
              <span className="ml-auto text-xs bg-background/50 px-2 py-0.5 rounded-full">{flashcards.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("mindmap")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "mindmap" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <Brain className="h-4 w-4" />
              Mind Map
            </button>
          </div>
        </div>

        {activeTab === "flashcards" && (
          <div className="p-4">
            <button
              onClick={startStudySession}
              disabled={flashcards.filter((c) => c.nextReview <= new Date()).length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Start Study Session
            </button>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              {flashcards.filter((c) => c.nextReview <= new Date()).length} cards due for review
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {/* Create Note */}
              <div className="glass rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Note
                </h3>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full rounded-lg border bg-background/50 px-4 py-2.5 outline-none focus:border-accent"
                />
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  rows={6}
                  className="w-full rounded-lg border bg-background/50 px-4 py-2.5 outline-none focus:border-accent resize-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedTags.join(", ")}
                    onChange={(e) => setSelectedTags(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                    placeholder="Tags (comma separated)..."
                    className="flex-1 rounded-lg border bg-background/50 px-4 py-2.5 outline-none focus:border-accent text-sm"
                  />
                  <button
                    onClick={createNote}
                    className="px-6 py-2.5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
                  >
                    Save Note
                  </button>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="w-full rounded-lg border bg-background/50 pl-10 pr-4 py-2.5 outline-none focus:border-accent"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedTags.includes(tag) ? "bg-accent text-foreground" : "bg-background/50 text-muted-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <div key={note.id} className="glass rounded-lg p-5 hover:border-accent/50 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold">{note.title}</h4>
                      <button
                        onClick={() => setNotes((prev) => prev.filter((n) => n.id !== note.id))}
                        className="text-muted-foreground hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{note.content}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {note.updatedAt.toLocaleDateString()}
                      {note.tags.length > 0 && (
                        <>
                          <span>•</span>
                          {note.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded bg-accent/30">
                              {tag}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Flashcards Tab */}
        {activeTab === "flashcards" && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              {/* Study Session */}
              {currentCard ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      Card {studySession.reviewed + 1} of {studySession.due.length}
                    </div>
                    <div className="w-full bg-background/50 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${((studySession.reviewed + 1) / studySession.due.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div
                    className="relative h-80 cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6 }}
                      style={{ transformStyle: "preserve-3d" }}
                      className="relative w-full h-full"
                    >
                      <div className="absolute inset-0 glass rounded-2xl p-8 flex items-center justify-center backface-hidden">
                        <p className="text-2xl font-semibold text-center">{currentCard.front}</p>
                      </div>
                      <div
                        className="absolute inset-0 glass rounded-2xl p-8 flex items-center justify-center backface-hidden"
                        style={{ transform: "rotateY(180deg)" }}
                      >
                        <p className="text-2xl font-semibold text-center">{currentCard.back}</p>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((quality) => (
                      <button
                        key={quality}
                        onClick={() => handleCardResponse(quality)}
                        className="px-6 py-3 rounded-lg border bg-background/50 hover:bg-accent transition-all text-sm font-medium"
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    1=Again, 2=Hard, 3=Good, 4=Easy, 5=Perfect
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Create Flashcard */}
                  <div className="glass rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create Flashcard
                    </h3>
                    <input
                      type="text"
                      value={cardFront}
                      onChange={(e) => setCardFront(e.target.value)}
                      placeholder="Front of card..."
                      className="w-full rounded-lg border bg-background/50 px-4 py-2.5 outline-none focus:border-accent"
                    />
                    <textarea
                      value={cardBack}
                      onChange={(e) => setCardBack(e.target.value)}
                      placeholder="Back of card..."
                      rows={4}
                      className="w-full rounded-lg border bg-background/50 px-4 py-2.5 outline-none focus:border-accent resize-none"
                    />
                    <button
                      onClick={createFlashcard}
                      className="px-6 py-2.5 rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
                    >
                      Add Flashcard
                    </button>
                  </div>

                  {/* Flashcards List */}
                  <div className="grid gap-3 md:grid-cols-2">
                    {flashcards.map((card) => (
                      <div key={card.id} className="glass rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm font-medium truncate flex-1">{card.front}</div>
                          <button
                            onClick={() => setFlashcards((prev) => prev.filter((c) => c.id !== card.id))}
                            className="text-muted-foreground hover:text-rose-400 transition-colors ml-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Next review: {card.nextReview.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mind Map Tab */}
        {activeTab === "mindmap" && (
          <div className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl mx-auto w-full h-full">
              <div className="glass rounded-lg p-4 mb-4 flex items-center gap-3">
                <button
                  onClick={() => addMindMapNode(mindMap.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  Add Root Node
                </button>
                <div className="text-xs text-muted-foreground">
                  Click on a node to select it, then add child nodes
                </div>
              </div>

              <div className="glass rounded-lg h-[600px] relative overflow-hidden bg-background/30">
                <svg className="w-full h-full">
                  {renderMindMapConnections(mindMap)}
                </svg>
                {renderMindMapNodes(mindMap)}
              </div>

              {selectedNode && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass rounded-lg p-4 flex gap-3">
                  <input
                    type="text"
                    value={selectedNode.text}
                    onChange={(e) => updateMindMapNode(selectedNode.id, e.target.value)}
                    className="rounded-lg border bg-background/50 px-4 py-2 outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => addMindMapNode(selectedNode.id)}
                    className="px-4 py-2 rounded-lg bg-accent text-sm font-medium"
                  >
                    Add Child
                  </button>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="px-4 py-2 rounded-lg border text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function renderMindMapNodes(node: MindMapNode, selectedId: string | null = null, onSelect: (node: MindMapNode) => void = () => {}): React.ReactNode {
  return (
    <>
      <div
        onClick={() => onSelect(node)}
        className={`absolute px-4 py-2 rounded-lg border cursor-pointer transition-all ${
          selectedId === node.id ? "bg-accent border-accent" : "bg-background/50 border-border hover:border-accent"
        }`}
        style={{ left: node.x, top: node.y }}
      >
        {node.text}
      </div>
      {node.children.map((child) => renderMindMapNodes(child, selectedId, onSelect))}
    </>
  );
}

function renderMindMapConnections(node: MindMapNode): React.ReactNode {
  return (
    <>
      {node.children.map((child) => (
        <line
          key={`${node.id}-${child.id}`}
          x1={node.x + 50}
          y1={node.y + 20}
          x2={child.x + 50}
          y2={child.y + 20}
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted-foreground/50"
        />
      ))}
      {node.children.map((child) => renderMindMapConnections(child))}
    </>
  );
}
