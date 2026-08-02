import type { AgentEvent } from "../../types/agent-events";

interface GitHubRepoInfo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  openIssues: number;
  defaultBranch: string;
}

interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  content?: string;
}

export async function analyzeRepository(
  repoUrl: string,
  token?: string
): Promise<{ info: GitHubRepoInfo; files: GitHubFile[]; events: AgentEvent[] }> {
  const events: AgentEvent[] = [];
  const startTime = Date.now();

  // Parse owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL. Use https://github.com/owner/repo");
  }
  const [, owner, repo] = match;

  events.push({
    id: crypto.randomUUID(),
    type: "tool_call",
    tool: "github",
    message: `Fetching repository info for ${owner}/${repo}`,
    timestamp: Date.now(),
    status: "active",
  });

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Fetch repo info
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
  });
  if (!repoRes.ok) {
    events.push({
      id: crypto.randomUUID(),
      type: "error",
      tool: "github",
      message: `Failed to fetch repo: ${repoRes.status} ${repoRes.statusText}`,
      timestamp: Date.now(),
      status: "failed",
      duration: Date.now() - startTime,
    });
    throw new Error(`GitHub API error: ${repoRes.status}`);
  }

  const repoData = await repoRes.json();
  const info: GitHubRepoInfo = {
    name: repoData.full_name,
    description: repoData.description || "No description",
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    language: repoData.language || "Unknown",
    openIssues: repoData.open_issues_count,
    defaultBranch: repoData.default_branch,
  };

  events.push({
    id: crypto.randomUUID(),
    type: "tool_result",
    tool: "github",
    message: `Found ${info.name} — ${info.stars} stars, ${info.language}`,
    timestamp: Date.now(),
    status: "completed",
    duration: Date.now() - startTime,
  });

  // Fetch root files
  const filesRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/`,
    { headers }
  );
  const files: GitHubFile[] = filesRes.ok
    ? ((await filesRes.json()) as GitHubFile[])
    : [];

  return { info, files, events };
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers }
  );
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  const data = await res.json();
  return Buffer.from(data.content, "base64").toString("utf-8");
}
