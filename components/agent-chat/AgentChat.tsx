"use client";

import { useState, useRef, useEffect } from "react";
import { useAgentStore } from "@/lib/store/agent-store";
import { executeTask } from "@/lib/agent/executor";
import { Send, Loader2, Sparkles } from "lucide-react";

export function AgentChat() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, setStatus, addEvent, setActiveTool, setProcessing, isProcessing, streamingContent, setStreamingContent, updateMetrics, reset } = useAgentStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamingContent]);

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

    // Streaming placeholder
    const assistantId = crypto.randomUUID();
    addMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      streaming: true,
    });

    try {
      const result = await executeTask(userMsg.content);

      // Simulate streaming the response
      const words = result.response.split(" ");
      let streamed = "";
      for (let i = 0; i < words.length; i++) {
        streamed += (i > 0 ? " " : "") + words[i];
        setStreamingContent(streamed);
        await new Promise((r) => setTimeout(r, 20));
      }

      // Update events
      for (const event of result.events) {
        addEvent(event);
        if (event.tool) {
          setActiveTool(event.tool);
          setStatus("tool_call");
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      setStatus("success");
      setActiveTool(null);
      updateMetrics({
        responseTime: result.metrics.totalTime,
        tokens: result.metrics.tokensEstimate,
        cost: result.metrics.tokensEstimate * 0.00001,
      });

      // Finalize message
      addMessage({
        id: assistantId,
        role: "assistant",
        content: result.response,
        events: result.events,
      });
    } catch (err) {
      setStatus("error");
      addMessage({
        id: assistantId,
        role: "assistant",
        content: `Error: ${(err as Error).message}`,
      });
    } finally {
      setStreamingContent("");
      setProcessing(false);
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
              Try: "Check my GitHub repo, find errors, improve Docker config"
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
