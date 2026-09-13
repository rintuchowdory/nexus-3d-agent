// Preset workflow pipelines shared by the workflows page and the store.
// Plain data only — safe to import from both client and server code.

export interface PresetNode {
  id: string;
  type: "input" | "agent" | "tool" | "output";
  x: number;
  y: number;
  label: string;
}

export interface PresetEdge {
  source: string;
  target: string;
}

export interface WorkflowPreset {
  name: string;
  defaultTask: string;
  nodes: PresetNode[];
  edges: PresetEdge[];
}

function pipeline(steps: string[]): { nodes: PresetNode[]; edges: PresetEdge[] } {
  const types: Record<string, PresetNode["type"]> = {
    Input: "input",
    Output: "output",
  };
  const nodes: PresetNode[] = steps.map((label, i) => ({
    id: `n${i}`,
    type: types[label] ?? (label.includes("Agent") && !label.includes("Research") ? "agent" : "tool"),
    x: 80 + i * 200,
    y: label.includes("Research") || i % 2 === 0 ? 40 : 130,
    label,
  }));
  const edges: PresetEdge[] = nodes.slice(0, -1).map((n, i) => ({
    source: n.id,
    target: nodes[i + 1].id,
  }));
  return { nodes, edges };
}

export const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    name: "Analyse GitHub Repository",
    defaultTask: "Analyze https://github.com/rintuchowdory/nexus-3d-agent and summarize its health",
    ...pipeline(["Input", "Router", "GitHub Agent", "Verifier", "Output"]),
  },
  {
    name: "Fix Docker Deployment",
    defaultTask: "Review the Docker setup of https://github.com/rintuchowdory/nexus-3d-agent and suggest fixes",
    ...pipeline(["Input", "Router", "Docker Agent", "Deploy Agent", "Output"]),
  },
  {
    name: "Generate Documentation",
    defaultTask: "Document the structure of https://github.com/rintuchowdory/nexus-3d-agent",
    ...pipeline(["Input", "Router", "GitHub Agent", "File Analysis", "Output"]),
  },
  {
    name: "Search & Research",
    defaultTask: "Research best practices for deploying Next.js apps in 2026",
    ...pipeline(["Input", "Router", "Web Research", "Verifier", "Output"]),
  },
];

export function blankWorkflow(): { nodes: PresetNode[]; edges: PresetEdge[] } {
  return pipeline(["Input", "Output"]);
}
