import { NextRequest } from "next/server";
import { streamGroq, GROQ_SYSTEM_PROMPT } from "../../../../lib/llm/groq";
import { routeTask } from "../../../../lib/agent/router";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Parse the body safely: malformed/missing JSON must yield 400, not a 500.
  let message: unknown;
  try {
    const body = await req.json();
    message = (body as { message?: unknown })?.message;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof message !== "string" || !message.trim()) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const routes = routeTask(message);
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: "routes", routes })}\n\n`
        ));

        if (!apiKey) {
          // Honest mock mode: only when no key is configured at all.
          const mockResponse = `[Mock Mode] No GROQ_API_KEY set. Routed "${message}" to: ${routes.map(r => r.tool).join(", ")}.`;
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "token", content: mockResponse })}\n\n`
          ));
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "complete", response: mockResponse })}\n\n`
          ));
        } else {
          let fullResponse = "";
          for await (const chunk of streamGroq([
            { role: "system", content: GROQ_SYSTEM_PROMPT },
            { role: "user", content: message },
          ], { maxTokens: 2048 })) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: "token", content: chunk })}\n\n`
            ));
          }
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "complete", response: fullResponse })}\n\n`
          ));
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        // Report provider failures as errors instead of disguising them as
        // chat text ("[Mock Mode] ... Error: ...").
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : "Unknown error" })}\n\n`
        ));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
