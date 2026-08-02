import type { ToolType } from "../../types/agent-events";

export interface RouteResult {
  tool: ToolType;
  action: string;
  priority: number;
}

export function routeTask(instruction: string): RouteResult[] {
  const routes: RouteResult[] = [];
  const lower = instruction.toLowerCase();

  if (lower.includes("github") || lower.includes("repo") || lower.includes("repository")) {
    routes.push({ tool: "github", action: "analyze repository", priority: 1 });
  }
  if (lower.includes("docker") || lower.includes("container") || lower.includes("dockerfile")) {
    routes.push({ tool: "docker", action: "analyze Docker configuration", priority: 2 });
  }
  if (lower.includes("deploy") || lower.includes("deployment") || lower.includes("ci/cd")) {
    routes.push({ tool: "deployment", action: "prepare deployment plan", priority: 3 });
  }
  if (lower.includes("error") || lower.includes("bug") || lower.includes("fix")) {
    routes.push({ tool: "fileAnalysis", action: "find and fix errors", priority: 1 });
  }
  if (lower.includes("search") || lower.includes("find") || lower.includes("research")) {
    routes.push({ tool: "webSearch", action: "search for information", priority: 2 });
  }
  if (lower.includes("database") || lower.includes("sql") || lower.includes("query")) {
    routes.push({ tool: "database", action: "analyze database", priority: 2 });
  }
  if (routes.length === 0) {
    routes.push({ tool: "fileAnalysis", action: "analyze and respond", priority: 1 });
  }

  return routes.sort((a, b) => a.priority - b.priority);
}
