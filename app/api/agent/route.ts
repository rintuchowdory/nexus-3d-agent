import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

const SYSTEM_PROMPT = `You are NEXUS-3D, an advanced AI agent control center. You help users with GitHub repository analysis, Docker configuration, deployment planning, bug detection, web research, and database analysis. You are concise, technical, and direct.`;

interface Route {
  tool: string;
  action: string;
  priority: number;
}

// Simple keyword-based routing (kept for the UI timeline visualization)
function routeMessage(message: string): Route[] {
  const routes: Route[] = [];
  const lower = message.toLowerCase();
  if (lower.includes("github") || lower.includes("repo")) routes.push({ tool: "github", action: "analyze repository", priority: 1 });
  if (lower.includes("docker") || lower.includes("container")) routes.push({ tool: "docker", action: "analyze Docker", priority: 2 });
  if (lower.includes("deploy")) routes.push({ tool: "deployment", action: "deployment plan", priority: 3 });
  if (lower.includes("error") || lower.includes("bug") || lower.includes("fix")) routes.push({ tool: "fileAnalysis", action: "fix errors", priority: 1 });
  if (routes.length === 0) routes.push({ tool: "fileAnalysis", action: "analyze and respond", priority: 1 });
  return routes;
}

export async function POST(req: NextRequest) {
  // Parse the body safely: malformed/missing JSON must yield 400, not a 500.
  let message: unknown;
  try {
    const body = await req.json();
    message = (body as { message?: unknown })?.message;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const routes = routeMessage(message);
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2;

  if (!apiKey) {
    return NextResponse.json({
      response: `[Mock Mode] Routed "${message}" to: ${routes.map(r => r.tool).join(", ")}. No GROQ_API_KEY set.`,
      routes,
      model: GROQ_MODEL,
      powered: "mock",
    });
  }

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      // Don't hand raw provider errors to the client as a "chat response" —
      // report a structured error the UI can render as an error state.
      return NextResponse.json(
        {
          error: `Groq API error ${groqRes.status}: ${errText.slice(0, 200)}`,
          routes,
          model: GROQ_MODEL,
          powered: "groq",
        },
        { status: 502 }
      );
    }

    const data = await groqRes.json();
    return NextResponse.json({
      response: data.choices?.[0]?.message?.content || "No response generated",
      routes,
      model: GROQ_MODEL,
      powered: "groq",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "LLM request failed", routes, model: GROQ_MODEL, powered: "groq" },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    agent: "NEXUS-3D",
    llm: process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2 ? "groq" : "mock",
    model: GROQ_MODEL,
  });
}
