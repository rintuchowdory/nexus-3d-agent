export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

import { executeTask } from "@/lib/agent/executor";

import { verifyResults } from "@/lib/agent/verifier";

export async function POST(req: NextRequest) {
  try {
    const { instruction } = await req.json();

    if (!instruction || typeof instruction !== "string") {
      return NextResponse.json(
        { error: "instruction is required" },
        { status: 400 }
      );
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const result = await executeTask(instruction, { githubToken });
    const verification = verifyResults(result.events);

    return NextResponse.json({
      response: result.response,
      events: result.events,
      verification,
      metrics: result.metrics,
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
    message: "NEXUS-3D Agent API",
    endpoints: {
      POST: "Send instruction in body: { instruction: string }",
    },
  });
}
