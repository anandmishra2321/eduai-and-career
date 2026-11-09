"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, Paperclip, MoreVertical, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: string[];
}

interface ChatInterfaceProps {
  onSendMessage?: (message: string) => Promise<string>;
  placeholder?: string;
  showVoiceInput?: boolean;
  maxHistory?: number;
}

export function ChatInterface({
  onSendMessage,
  placeholder = "Ask EduAI anything...",
  showVoiceInput = true,
  maxHistory = 50,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm EduAI, your intelligent learning assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev.slice(-maxHistory + 1), userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      let response = "";
      if (onSendMessage) {
        response = await onSendMessage(input);
      } else {
        // Simulated response
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = generateSimulatedResponse(input);
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateSimulatedResponse = (query: string): string => {
    const responses = [
      "That's a great question! Based on your learning profile, I'd recommend starting with the fundamentals and building up gradually.",
      "I can help you with that. Let me break this down into manageable steps for better understanding.",
      "Excellent curiosity! This topic connects to several other concepts you've been studying. Would you like me to show those connections?",
      "Based on your recent progress, you're ready to tackle this. I'll provide some exercises to reinforce your understanding.",
      "This is a common point of confusion. Let me explain it with a practical example that might help clarify.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-accent/5">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent/50 text-foreground"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {message.role === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-foreground" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="bg-accent/50 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background/50 backdrop-blur-sm p-4">
        <div className="flex gap-2 items-end">
          <button className="p-2 rounded-lg hover:bg-accent transition-colors">
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              rows={1}
              className="w-full rounded-lg border bg-background px-4 py-3 pr-12 resize-none outline-none focus:border-primary transition-colors"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
          </div>
          {showVoiceInput && (
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording ? "bg-rose-500 text-white" : "hover:bg-accent"
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
