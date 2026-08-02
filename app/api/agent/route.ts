export const dynamic = "force-static";
export function GET() {
  return Response.json({ status: "ok", message: "NEXUS-3D API — static mode" });
}
export function POST() {
  return Response.json({ 
    response: "NEXUS-3D is running in static mode. Deploy with `output: standalone` for full AI agent capabilities.",
    steps: [{ action: "static_mode", status: "info" }]
  });
}
