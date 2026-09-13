import { routeTask } from "./router";
import { analyzeRepository, getFileContent } from "../tools/github";
import { analyzeDockerfile } from "../tools/docker";
import { webSearch } from "../tools/web-search";

export interface StepResult {
  summary: string;
  detail: string;
}

export interface StepContext {
  task: string;
  /** Results of previously executed steps, in run order. */
  results: { label: string; result: StepResult }[];
}

const DEFAULT_REPO = "https://github.com/vercel/next.js";

function matchRepoUrl(text: string): string | null {
  const m = text.match(/https?:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/);
  return m?.[0].replace(/\.git$/, "") ?? null;
}

function repoParts(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

/**
 * Executes one workflow node based on its label.
 * Labels are matched leniently ("GitHub Agent", "Web Research",
 * "Docker Agent", "Verification Agent", ...) so custom nodes work too.
 */
export async function runWorkflowStep(
  label: string,
  ctx: StepContext
): Promise<StepResult> {
  const l = label.toLowerCase();
  const token = process.env.GITHUB_TOKEN;

  if (l.includes("input")) {
    return {
      summary: "Task received",
      detail: `Task: ${ctx.task}`,
    };
  }

  if (l.includes("router")) {
    const routes = routeTask(ctx.task);
    if (routes.length === 0) {
      return {
        summary: "No tools matched — defaulting to webSearch",
        detail: "No explicit tool keywords detected in the task. Falling back to web search.",
      };
    }
    return {
      summary: `Routed to: ${routes.map((r) => r.tool).join(", ")}`,
      detail: routes.map((r) => `• ${r.tool}: ${r.action}`).join("\n"),
    };
  }

  if (l.includes("github")) {
    const repoUrl = matchRepoUrl(ctx.task) || DEFAULT_REPO;
    const { info, files } = await analyzeRepository(repoUrl, token);
    return {
      summary: `${info.name}: ${info.stars}⭐, ${info.language}, ${files.length} root files`,
      detail: [
        `## Repository: ${info.name}`,
        info.description ?? "",
        `Stars: ${info.stars} | Forks: ${info.forks} | Open issues: ${info.openIssues} | Branch: ${info.defaultBranch}`,
        "",
        `Root files: ${files.map((f) => f.name).join(", ")}`,
      ].join("\n"),
    };
  }

  if (l.includes("docker")) {
    const repoUrl = matchRepoUrl(ctx.task);
    const parts = repoUrl ? repoParts(repoUrl) : null;
    if (parts) {
      try {
        const content = await getFileContent(parts.owner, parts.repo, "Dockerfile", token);
        const analysis = analyzeDockerfile(content);
        return {
          summary: `Dockerfile analyzed: ${analysis.issues.length} issues, ${analysis.suggestions.length} suggestions`,
          detail: [
            "## Dockerfile Analysis",
            "",
            "Issues:",
            ...(analysis.issues.length
              ? analysis.issues.map((i) => `- ⚠️ ${i}`)
              : ["- None. The Dockerfile follows best practices."]),
            "",
            "Suggestions:",
            ...analysis.suggestions.map((s) => `- 💡 ${s}`),
          ].join("\n"),
        };
      } catch {
        return {
          summary: "No Dockerfile found in repository",
          detail: `No Dockerfile at the root of ${parts.owner}/${parts.repo}. A Docker configuration would be needed to containerize this app.`,
        };
      }
    }
    return {
      summary: "General Docker checklist applied",
      detail: [
        "## Docker Best Practices",
        "",
        "- Use multi-stage builds to shrink the final image",
        "- Pin base image versions (avoid :latest)",
        "- Add a .dockerignore for node_modules, .git, .next cache",
        "- Run as a non-root user",
        "- Set a HEALTHCHECK instruction",
      ].join("\n"),
    };
  }

  if (l.includes("deploy")) {
    return {
      summary: "Deployment plan prepared",
      detail: [
        "## Deployment Plan",
        "",
        "1. **Build**: multi-stage Docker build for production",
        "2. **Test**: run CI tests in GitHub Actions",
        "3. **Deploy**: push to Vercel / Render / Fly.io",
        "4. **Monitor**: health checks and alerting",
        "5. **Scale**: configure auto-scaling rules",
      ].join("\n"),
    };
  }

  if (l.includes("web") || l.includes("research") || l.includes("search")) {
    const results = await webSearch(ctx.task);
    return {
      summary: `${results.length} result(s) retrieved`,
      detail: results.map((r) => `- [${r.title}](${r.url}) — ${r.snippet}`).join("\n"),
    };
  }

  if (l.includes("file")) {
    const repoUrl = matchRepoUrl(ctx.task);
    if (repoUrl) {
      const { info, files } = await analyzeRepository(repoUrl, token);
      return {
        summary: `Analyzed file structure of ${info.name}`,
        detail: `Project structure of ${info.name} (${info.language}):\n\n${files
          .map((f) => `- ${f.name}`)
          .join("\n")}`,
      };
    }
    return {
      summary: "No repository provided for file analysis",
      detail: "Provide a GitHub URL in the task to enable file analysis.",
    };
  }

  if (l.includes("verif")) {
    const failed = ctx.results.filter((r) => r.result.summary.toLowerCase().includes("no "));
    return {
      summary: failed.length
        ? `${ctx.results.length} steps checked, ${failed.length} incomplete`
        : `${ctx.results.length} steps verified successfully`,
      detail: failed.length
        ? `Steps with incomplete results: ${failed.map((f) => f.label).join(", ")}`
        : "All steps produced usable output.",
    };
  }

  return {
    summary: "Step executed",
    detail: `${label}: no dedicated handler, skipped.`,
  };
}
