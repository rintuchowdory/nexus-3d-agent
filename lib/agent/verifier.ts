import type { AgentEvent } from "@/types/agent-events";

export function verifyResults(events: AgentEvent[]): {
  allPassed: boolean;
  failures: string[];
  summary: string;
} {
  const failures = events
    .filter((e) => e.status === "failed")
    .map((e) => e.message);

  const completedCount = events.filter((e) => e.status === "completed").length;
  const totalCount = events.length;

  return {
    allPassed: failures.length === 0,
    failures,
    summary: `${completedCount}/${totalCount} steps completed${failures.length > 0 ? `, ${failures.length} failures` : ""}`,
  };
}
