import { NextResponse } from "next/server";

// In production, this would fetch from a database (Supabase/PostgreSQL)
// For MVP, events are stored in-memory on the client side via Zustand

export async function GET() {
  return NextResponse.json({
    status: "ok",
    events: [],
    message: "Events are streamed via SSE from /api/agent/stream",
  });
}
