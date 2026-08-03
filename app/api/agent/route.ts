import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are NEXUS-3D, an advanced AI agent control center. You help users with GitHub repository analysis, Docker configuration, deployment planning, bug detection, web research, and database analysis. You are concise, technical, and direct.`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Simple keyword-based routing
    const routes: Array<{ tool: string; action: string; priority: number }> = [];
    const lower = message.toLowerCase();
    if (lower.includes("github") || lower.includes("repo")) routes.push({ tool: "github", action: "analyze repository", priority: 1 });
    if (lower.includes("docker") || lower.includes("container")) routes.push({ tool: "docker", action: "analyze Docker", priority: 2 });
    if (lower.includes("deploy")) routes.push({ tool: "deployment", action: "deployment plan", priority: 3 });
    if (lower.includes("error") || lower.includes("bug") || lower.includes("fix")) routes.push({ tool: "fileAnalysis", action: "fix errors", priority: 1 });
    if (routes.length === 0) routes.push({ tool: "fileAnalysis", action: "analyze and respond", priority: 1 });

    // Try Groq API
    const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2;
    let response = "";
    let powered = "mock";

    if (apiKey) {
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

        if (groqRes.ok) {
          const data = await groqRes.json();
          response = data.choices?.[0]?.message?.content || "No response generated";
          powered = "groq";
        } else {
          const errText = await groqRes.text();
          response = `Groq API error ${groqRes.status}: ${errText.slice(0, 200)}`;
        }
      } catch (e) {
        response = `LLM Error: ${e instanceof Error ? e.message : "unknown"}`;
      }
    } else {
      response = `[Mock Mode] Routed "${message}" to: ${routes.map(r => r.tool).join(", ")}. No GROQ_API_KEY set.`;
    }

    return NextResponse.json({
      response,
      routes,
      model: GROQ_MODEL,
      powered,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    agent: "NEXUS-3D",
    llm: process.env.GROQ_API_KEY ? "groq" : "mock",
    model: GROQ_MODEL,
  });
}
