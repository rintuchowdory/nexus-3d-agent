import { NextRequest, NextResponse } from "next/server";
import { routeTask } from "../../../lib/agent/router";
import { callGroq, GROQ_SYSTEM_PROMPT } from "../../../lib/llm/groq";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const routes = routeTask(message);

    let response: string;
    let powered = "mock";
    try {
      response = await callGroq([
        { role: "system", content: GROQ_SYSTEM_PROMPT },
        { role: "user", content: message },
      ], { maxTokens: 2048 });
      powered = "groq";
    } catch (llmError) {
      response = `[Mock Mode] I would analyze your request: "${message}". ` +
        `Routed to: ${routes.map(r => `${r.tool}(${r.action})`).join(", ")}. ` +
        `LLM Error: ${llmError instanceof Error ? llmError.message : "unknown"}`;
    }

    return NextResponse.json({
      response,
      routes,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
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
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  });
}
