export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

import { analyzeRepository, getFileContent } from "@/lib/tools/github";


export async function POST(req: NextRequest) {
  try {
    const { url, action } = await req.json();
    const token = process.env.GITHUB_TOKEN;

    if (action === "file") {
      const { owner, repo, path } = await req.json();
      const content = await getFileContent(owner, repo, path, token);
      return NextResponse.json({ content });
    }

    const result = await analyzeRepository(url, token);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "GitHub inspection API. POST with { url: string } to analyze a repo.",
  });
}
