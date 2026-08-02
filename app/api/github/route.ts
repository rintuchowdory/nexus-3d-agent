export const dynamic = "force-static";
export function GET() {
  return Response.json({ repos: [], message: "GitHub API requires server runtime" });
}
