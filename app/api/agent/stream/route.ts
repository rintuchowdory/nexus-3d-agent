export const runtime = "edge";

import { NextRequest } from "next/server";

import { executeTask } from "@/lib/agent/executor";

import type { AgentEvent } from "@/types/agent-events";

export async function POST(req: NextRequest) {
  try {
    const { instruction } = await req.json();
    if (!instruction) {
      return new Response(JSON.stringify({ error: "instruction required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        sendEvent("start", { instruction });

        const result = await executeTask(instruction, {
          githubToken: process.env.GITHUB_TOKEN,
        });

        // Stream events one by one
        for (const event of result.events) {
          sendEvent("event", event);
          await new Promise((r) => setTimeout(r, 100));
        }

        // Stream response text in chunks
        const words = result.response.split(" ");
        for (let i = 0; i < words.length; i++) {
          sendEvent("token", { text: words[i] + (i < words.length - 1 ? " " : "") });
          await new Promise((r) => setTimeout(r, 10));
        }

        sendEvent("complete", { metrics: result.metrics });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
