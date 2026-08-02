import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ 
    events: [],
    message: "Event stream API — connect via SSE for real-time updates"
  });
}
