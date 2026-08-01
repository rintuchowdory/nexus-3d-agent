export type AgentStatus =
  | "idle"
  | "thinking"
  | "tool_call"
  | "success"
  | "error"
  | "waiting";

export type ToolType =
  | "github"
  | "docker"
  | "terminal"
  | "browser"
  | "database"
  | "deployment"
  | "fileAnalysis"
  | "webSearch"
  | "memory";

export interface AgentEvent {
  id: string;
  type: "plan" | "tool_call" | "tool_result" | "error" | "thinking" | "complete";
  tool?: ToolType;
  message: string;
  timestamp: number;
  duration?: number;
  status: "pending" | "active" | "completed" | "failed";
}

export interface ToolNodeData {
  type: ToolType;
  label: string;
  status: AgentStatus;
  active: boolean;
}

export interface PerformanceMetrics {
  responseTime: number;
  tokens: number;
  cost: number;
  completedTasks: number;
  failedTasks: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  events?: AgentEvent[];
  streaming?: boolean;
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  tool?: ToolType;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}
