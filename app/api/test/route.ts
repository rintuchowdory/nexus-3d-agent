import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({ ok: true, message: "test route works" });
}
export async function POST() {
  return NextResponse.json({ ok: true, message: "test POST works" });
}
