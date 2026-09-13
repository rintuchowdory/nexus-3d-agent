import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * SSE stub. Emits a single "connected" event with correct MIME type so
 * clients using EventSource connect cleanly. Real events will be pushed
 * here once server-side event broadcasting is implemented.
 */
export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", message: "Event stream connected" })}\n\n`)
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
}

// Keep the JSON shape available for non-SSE clients (e.g. health checks).
export async function HEAD() {
  return new NextResponse(null);
}
