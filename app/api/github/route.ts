import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ 
      repos: [], 
      message: "GITHUB_TOKEN not configured" 
    });
  }
  try {
    const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=10", {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    const repos = await res.json();
    return NextResponse.json({ repos: repos.slice(0, 10).map((r: any) => ({
      name: r.full_name, url: r.html_url, stars: r.stargazers_count, openPrs: r.open_issues_count
    }))});
  } catch {
    return NextResponse.json({ repos: [], message: "GitHub API error" });
  }
}
