export interface DockerAnalysisResult {
  hasDockerfile: boolean;
  hasDockerCompose: boolean;
  hasDockerIgnore: boolean;
  issues: string[];
  suggestions: string[];
  buildStageOptimized: boolean;
}

export function analyzeDockerfile(content: string): DockerAnalysisResult {
  const lines = content.split("\n");
  const issues: string[] = [];
  const suggestions: string[] = [];
  let buildStageOptimized = false;

  // Check for multi-stage build
  const fromCount = lines.filter((l) =>
    l.trim().toUpperCase().startsWith("FROM")
  ).length;
  if (fromCount > 1) {
    buildStageOptimized = true;
  } else {
    suggestions.push(
      "Use multi-stage build to reduce final image size (FROM ... AS builder, then FROM ... COPY --from=builder)"
    );
  }

  // Check for root user
  const hasUser = lines.some((l) => l.trim().toUpperCase().startsWith("USER"));
  if (!hasUser) {
    issues.push("Running as root — add USER directive for security");
    suggestions.push("Add `USER node` or `USER app` after setting up the app");
  }

  // Check for .dockerignore
  suggestions.push("Ensure .dockerignore excludes node_modules, .git, .env");

  // Check for health check
  const hasHealthCheck = lines.some((l) =>
    l.trim().toUpperCase().startsWith("HEALTHCHECK")
  );
  if (!hasHealthCheck) {
    suggestions.push("Add HEALTHCHECK for container orchestration platforms");
  }

  // Check layer caching
  const copyAllIndex = lines.findIndex((l) =>
    l.trim().toUpperCase().startsWith("COPY . .")
  );
  if (copyAllIndex >= 0) {
    suggestions.push(
      "COPY . . invalidates cache on every change — copy package.json first, install, then copy source"
    );
  }

  return {
    hasDockerfile: true,
    hasDockerCompose: false,
    hasDockerIgnore: false,
    issues,
    suggestions,
    buildStageOptimized,
  };
}

export function analyzeDockerCompose(content: string): string[] {
  const suggestions: string[] = [];
  if (!content.includes("restart")) {
    suggestions.push("Add `restart: unless-stopped` to services");
  }
  if (!content.includes("healthcheck")) {
    suggestions.push("Add healthcheck definitions to services");
  }
  if (!content.includes("networks")) {
    suggestions.push("Define explicit networks for service isolation");
  }
  if (!content.includes("volumes")) {
    suggestions.push("Use named volumes for persistent data");
  }
  return suggestions;
}
