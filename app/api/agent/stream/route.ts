import { NextRequest } from "next/server";
import { streamGroq, GROQ_SYSTEM_PROMPT } from "../../../../lib/llm/groq";
import { routeTask } from "../../../../lib/agent/router";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const routes = routeTask(message);
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "routes", routes })}\n\n`
          ));

          try {
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
          } catch (llmError) {
            const mockResponse = `[Mock Mode] Routed "${message}" to: ${routes.map(r => r.tool).join(", ")}. Error: ${llmError instanceof Error ? llmError.message : "unknown"}`;
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: "token", content: mockResponse })}\n\n`
            ));
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: "complete", response: mockResponse })}\n\n`
            ));
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : "Unknown error" })}\n\n`
            )
          );
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
  } catch (error) {
    return new Response(JSON.stringify({ error: "Stream failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
