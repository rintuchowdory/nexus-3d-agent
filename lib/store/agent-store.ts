import { create } from "zustand";
import type {
  AgentStatus,
  AgentEvent,
  ToolType,
  PerformanceMetrics,
  ChatMessage,
} from "../../types/agent-events";

interface AgentState {
  status: AgentStatus;
  events: AgentEvent[];
  activeTool: ToolType | null;
  metrics: PerformanceMetrics;
  messages: ChatMessage[];
  streamingContent: string;
  isProcessing: boolean;

  setStatus: (s: AgentStatus) => void;
  addEvent: (e: AgentEvent) => void;
  setActiveTool: (t: ToolType | null) => void;
  updateMetrics: (m: Partial<PerformanceMetrics>) => void;
  addMessage: (m: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  setStreamingContent: (c: string) => void;
  setProcessing: (p: boolean) => void;
  reset: () => void;
}

const initialMetrics: PerformanceMetrics = {
  responseTime: 0,
  tokens: 0,
  cost: 0,
  completedTasks: 0,
  failedTasks: 0,
};

export const useAgentStore = create<AgentState>((set) => ({
  status: "idle",
  events: [],
  activeTool: null,
  metrics: initialMetrics,
  messages: [],
  streamingContent: "",
  isProcessing: false,

  setStatus: (s) => set({ status: s }),
  addEvent: (e) =>
    set((state) => ({
      events: [...state.events, e],
      metrics:
        e.type === "tool_result"
          ? {
              ...state.metrics,
              completedTasks:
                e.status === "completed"
                  ? state.metrics.completedTasks + 1
                  : state.metrics.completedTasks,
              failedTasks:
                e.status === "failed"
                  ? state.metrics.failedTasks + 1
                  : state.metrics.failedTasks,
            }
          : state.metrics,
    })),
  setActiveTool: (t) => set({ activeTool: t }),
  updateMetrics: (m) =>
    set((state) => ({ metrics: { ...state.metrics, ...m } })),
  addMessage: (m) =>
    set((state) => {
      // Upsert: finalizing a streaming placeholder reuses its id — appending
      // blindly created ghost bubbles and duplicate React keys.
      const index = state.messages.findIndex((msg) => msg.id === m.id);
      if (index !== -1) {
        const messages = [...state.messages];
        messages[index] = { ...messages[index], ...m };
        return { messages };
      }
      return { messages: [...state.messages, m] };
    }),
  updateMessage: (id, patch) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  setStreamingContent: (c) => set({ streamingContent: c }),
  setProcessing: (p) => set({ isProcessing: p }),
  reset: () =>
    set({
      status: "idle",
      events: [],
      activeTool: null,
      metrics: initialMetrics,
      messages: [],
      streamingContent: "",
      isProcessing: false,
    }),
}));
