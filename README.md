# NEXUS-3D — AI Agent Control Center

A futuristic web application where users give one instruction — such as:

> "Check my GitHub project, find errors, improve the Docker configuration, and prepare a deployment plan."

The AI agent executes the task while the dashboard visualizes every action as an
interactive 3D network.

## Features

- **Central 3D AI Core** — A glowing animated sphere that changes behavior based on
  agent status (idle, thinking, tool call, success, error)
- **Orbiting tool nodes** — GitHub, Docker, terminal, browser, database, deployment,
  file-analysis, and web-search tools visualized as 3D objects
- **Animated connections** — Lines light up with particle streams when the agent calls a tool
- **Live execution timeline** — Shows planning, tool calls, results, and errors with durations
- **Agent performance cards** — Response time, tokens, cost, completed tasks, and failures
- **Streaming chat** — The answer appears immediately, word by word
- **Visual workflow editor** — Connect agent nodes visually with React Flow

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| 3D | React Three Fiber, Drei, Three.js |
| Animations | Framer Motion |
| Workflow Editor | React Flow |
| Charts | Recharts |
| State | Zustand |
| Icons | Lucide React |
| Agent Backend | Next.js API routes, Vercel AI SDK (ready) |
| Tools | GitHub API, Docker analyzer, Web search |

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Add your GitHub token and AI provider key

# Run development server
npm run dev
```

Open http://localhost:3000

## Project Structure

```
nexus-3d-agent/
├── app/
│   ├── api/
│   │   ├── agent/route.ts          # Agent execution endpoint
│   │   ├── agent/stream/route.ts    # SSE streaming endpoint
│   │   ├── github/route.ts         # GitHub inspection API
│   │   └── events/route.ts         # Events history API
│   ├── dashboard/page.tsx          # Main dashboard (3D + chat + timeline)
│   ├── workflows/page.tsx          # Visual workflow editor
│   └── page.tsx                    # Landing page
├── components/
│   ├── agent-chat/AgentChat.tsx     # Streaming chat interface
│   ├── dashboard/
│   │   ├── ExecutionTimeline.tsx    # Live step-by-step execution
│   │   ├── PerformanceCards.tsx    # Stats cards
│   │   ├── StatusBar.tsx           # Agent status indicator
│   │   └── UsageChart.tsx           # Recharts area chart
│   ├── workflow-editor/WorkflowEditor.tsx  # React Flow editor
│   └── three/
│       ├── AgentCore.tsx           # Central glowing 3D sphere
│       ├── ToolNode.tsx            # Orbiting tool nodes
│       ├── ConnectionBeam.tsx      # Animated connection lines
│       └── AgentScene.tsx          # Main 3D canvas
├── lib/
│   ├── agent/
│   │   ├── router.ts                # Task routing logic
│   │   ├── executor.ts             # Multi-tool execution
│   │   └── verifier.ts             # Result verification
│   ├── tools/
│   │   ├── github.ts                # GitHub API integration
│   │   ├── docker.ts                # Dockerfile analyzer
│   │   └── web-search.ts            # Web search tool
│   └── store/agent-store.ts         # Zustand state management
└── types/agent-events.ts            # Shared types
```

## How the 3D Dashboard Works

### Agent Core
- **Idle** → slow rotation
- **Thinking** → pulsing light
- **Tool call** → connection beam with particle stream
- **Success** → green energy ring
- **Error** → red distorted pulse

### Tool Nodes
Each tool is a 3D object that orbits the central core:
- GitHub → rotating octahedron
- Docker → container cube
- Database → stacked cylinder
- Deployment → cloud sphere
- Others → octahedron variants

When active, the tool node moves closer to the center and glows.

### Performance
- 3D renders only on changes (on-demand rendering)
- Device pixel ratio capped at 2
- Instancing for repeated particles
- No React state updates inside the animation loop
- 3D scene loads dynamically after dashboard shell
- Mobile fallback: static 2D view

## MVP Scope

The first release focuses on four functions:
1. User enters a task
2. Agent streams its response
3. Agent inspects one GitHub repository
4. The 3D core and tool nodes animate from live agent events

## License

MIT
