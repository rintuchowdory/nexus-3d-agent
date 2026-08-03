import { NextRequest, NextResponse } from "next/server";
import { routeTask } from "../../../lib/agent/router";
import { callGroq, GROQ_SYSTEM_PROMPT } from "../../../lib/llm/groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Route to determine which tools are relevant
    const routes = routeTask(message);

    // Generate real LLM response via Groq
    let response: string;
    try {
      response = await callGroq([
        { role: "system", content: GROQ_SYSTEM_PROMPT },
        { role: "user", content: message },
      ], { maxTokens: 2048 });
    } catch (llmError) {
      // Fallback to mock if Groq isn't configured
      response = `[Mock Mode] I would analyze your request: "${message}". ` +
        `Routed to: ${routes.map(r => `${r.tool}(${r.action})`).join(", ")}. ` +
        `LLM Error: ${llmError instanceof Error ? llmError.message : "unknown"}`;
    }

    return NextResponse.json({
      response,
      routes,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      powered: "groq",
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
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  });
}
