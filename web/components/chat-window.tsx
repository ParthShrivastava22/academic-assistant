"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Loader2,
  BookMarked,
  AlertCircle,
  Layers,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ChatWindowProps {
  projectId: string;
  projectTitle: string;
  readyPaperCount: number;
}

export function ChatWindow({
  projectId,
  projectTitle,
  readyPaperCount,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading || readyPaperCount === 0) return;

    setError(null);
    setInput("");
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortRef.current = new AbortController();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, question, history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(await res.text());
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullContent += decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: fullContent } : m,
          ),
        );
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, isStreaming: false } : m,
        ),
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("[CHAT]", err);
      setError("Something went wrong. Make sure both servers are running.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate">
            Synthesis Chat
          </p>
          <p className="text-[10px] text-muted-foreground">
            {readyPaperCount} paper{readyPaperCount !== 1 ? "s" : ""} ·
            ScholarAI · FAISS RAG
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-5 max-w-full">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              {readyPaperCount === 0 ? (
                <div>
                  <p className="font-medium text-sm text-foreground">
                    No papers ready yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Upload papers and wait for them to finish processing before
                    starting a synthesis.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-sm text-foreground">
                    Ready to synthesize
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Ask me to compare methodologies, summarize findings, or
                    identify themes across your {readyPaperCount} paper
                    {readyPaperCount !== 1 ? "s" : ""}.
                  </p>
                </div>
              )}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                <AvatarFallback
                  className={
                    message.role === "assistant"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {message.role === "assistant" ? (
                    <Bot className="w-3.5 h-3.5" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div
                className={`flex-1 ${
                  message.role === "user" ? "flex flex-col items-end" : ""
                }`}
              >
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.content}
                  {message.isStreaming && (
                    <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Searching indicator */}
          {isLoading && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
                <span className="text-xs text-muted-foreground">
                  Searching across papers…
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              readyPaperCount === 0
                ? "Waiting for papers to finish processing…"
                : "Compare methodologies, summarize findings… (Enter to send)"
            }
            className="min-h-[40px] max-h-32 text-sm resize-none flex-1 py-2.5"
            rows={1}
            disabled={isLoading || readyPaperCount === 0}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || readyPaperCount === 0}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Answers cite specific papers · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
