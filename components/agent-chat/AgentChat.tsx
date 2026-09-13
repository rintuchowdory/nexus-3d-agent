"use client";

import { useState, useRef, useEffect } from "react";
import { useAgentStore } from "../../lib/store/agent-store";
import { Send, Loader2, Sparkles } from "lucide-react";

export function AgentChat() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { messages, addMessage, updateMessage, setStatus, addEvent, setActiveTool, setProcessing, isProcessing, streamingContent, setStreamingContent, updateMetrics, reset } = useAgentStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingContent]);

  // Abort any in-flight stream when the component unmounts.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: input,
    };
    addMessage(userMsg);
    setInput("");
    setProcessing(true);
    setStatus("thinking");

    const assistantId = crypto.randomUUID();
    // Single placeholder that is UPDATED in place when the stream completes —
    // never append a second message (that left a ghost bubble + duplicate key).
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
    });

    addEvent({
      id: crypto.randomUUID(),
      type: "plan",
      message: "Analyzing instruction and creating execution plan",
      timestamp: Date.now(),
      status: "completed",
      duration: 5,
    });

    const startTime = Date.now();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let detail = `Request failed (${res.status})`;
        try {
          const j = await res.json();
          if (j?.error) detail = j.error;
        } catch { /* keep default */ }
        throw new Error(detail);
      }

      // Parse the SSE stream: lines starting with "data: ".
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      let streamed = "";
      let routes: Array<{ tool: string; action: string; priority: number }> = [];

      const toolCallIds = new Map<string, string>();

      const handleEvent = (data: string) => {
        if (data === "[DONE]") return;
        let ev: {
          type?: string;
          content?: string;
          response?: string;
          message?: string;
          routes?: Array<{ tool: string; action: string; priority: number }>;
        };
        try {
          ev = JSON.parse(data);
        } catch {
          return;
        }
        switch (ev.type) {
          case "routes":
            routes = ev.routes ?? [];
            for (const route of routes) {
              const evId = crypto.randomUUID();
              toolCallIds.set(route.tool, evId);
              setActiveTool(route.tool as never);
              setStatus("tool_call");
              addEvent({
                id: evId,
                type: "tool_call",
                tool: route.tool as never,
                message: `${route.action}...`,
                timestamp: Date.now(),
                status: "active",
              });
            }
            break;
          case "token":
            streamed += ev.content ?? "";
            full = streamed;
            setStreamingContent(streamed);
            break;
          case "complete":
            full = ev.response ?? streamed;
            break;
          case "error":
            throw new Error(ev.message || "Agent error");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (line.startsWith("data: ")) handleEvent(line.slice(6));
          }
        }
      }
      // Flush any trailing buffered event.
      if (buffer.trim().startsWith("data: ")) handleEvent(buffer.trim().slice(6));

      if (!full) {
        throw new Error("The agent returned an empty response. Check that GROQ_API_KEY is valid.");
      }

      // Close out tool events from the routes.
      for (const route of routes) {
        const evId = toolCallIds.get(route.tool);
        if (evId) {
          addEvent({
            id: evId,
            type: "tool_result",
            tool: route.tool as never,
            message: `${route.action} completed`,
            timestamp: Date.now(),
            status: "completed",
            duration: Math.max(1, Date.now() - startTime),
          });
        }
      }

      addEvent({
        id: crypto.randomUUID(),
        type: "complete",
        message: "Task completed",
        timestamp: Date.now(),
        status: "completed",
        duration: Date.now() - startTime,
      });

      // Finalize the placeholder in place.
      updateMessage(assistantId, { content: full, streaming: false });

      const tokensEstimate = Math.max(1, Math.floor(full.length / 4));
      updateMetrics({
        responseTime: Date.now() - startTime,
        tokens: tokensEstimate,
        cost: tokensEstimate * 0.00001,
        completedTasks: useAgentStore.getState().metrics.completedTasks + 1,
      });
      setStatus("success");
      setActiveTool(null);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        updateMessage(assistantId, { content: "⏹ Response aborted.", streaming: false });
      } else {
        setStatus("error");
        updateMessage(assistantId, {
          content: `⚠️ ${(err as Error).message}`,
          streaming: false,
        });
        updateMetrics({
          failedTasks: useAgentStore.getState().metrics.failedTasks + 1,
        });
      }
    } finally {
      setStreamingContent("");
      setProcessing(false);
      abortRef.current = null;
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <div className="flex flex-col h-full bg-nexus-panel border border-nexus-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-nexus-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-nexus-accent" />
          <span className="font-mono text-sm text-nexus-text">NEXUS Agent</span>
        </div>
        <button
          onClick={reset}
          className="text-nexus-muted hover:text-nexus-accent text-xs font-mono transition-colors"
        >
          RESET
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-nexus-muted text-sm font-mono">
              Enter a task instruction to begin.
            </p>
            <p className="text-nexus-muted text-xs mt-2">
              Try: &quot;Check my GitHub repo, find errors, improve Docker config&quot;
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-nexus-accent/10 border border-nexus-accent/30 text-nexus-text"
                  : "bg-nexus-border/30 text-nexus-text"
              }`}
            >
              {msg.role === "assistant" && msg.streaming && streamingContent ? (
                <span className="font-mono text-xs">
                  {streamingContent}
                  <span className="animate-pulse">▊</span>
                </span>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-nexus-border p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter task instruction..."
          disabled={isProcessing}
          className="flex-1 bg-nexus-bg border border-nexus-border rounded-lg px-3 py-2 text-sm text-nexus-text placeholder:text-nexus-muted focus:border-nexus-accent focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="bg-nexus-accent/20 border border-nexus-accent/40 text-nexus-accent rounded-lg px-4 py-2 text-sm font-mono hover:bg-nexus-accent/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
