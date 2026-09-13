import { NextRequest } from "next/server";
import { streamGroq } from "../../../../lib/llm/groq";
import { runWorkflowStep, type StepContext, type StepResult } from "../../../../lib/agent/workflow";

export const runtime = "nodejs";

interface RunStep {
  id: string;
  label: string;
}

export async function POST(req: NextRequest) {
  let task: unknown;
  let steps: unknown;
  try {
    const body = await req.json();
    task = (body as { task?: unknown })?.task;
    steps = (body as { steps?: unknown })?.steps;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (typeof task !== "string" || !task.trim()) {
    return jsonError("Task is required", 400);
  }
  if (
    !Array.isArray(steps) ||
    steps.length === 0 ||
    !steps.every((s): s is RunStep =>
      typeof s === "object" &&
      s !== null &&
      typeof (s as RunStep).id === "string" &&
      typeof (s as RunStep).label === "string"
    )
  ) {
    return jsonError("steps must be a non-empty array of {id, label}", 400);
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        const ctx: StepContext = { task: task as string, results: [] };
        const collected: { label: string; result: StepResult }[] = [];

        for (const step of steps as RunStep[]) {
          send({ type: "step_start", nodeId: step.id, label: step.label });
          try {
            const result = await runWorkflowStep(step.label, ctx);
            ctx.results.push({ label: step.label, result });
            collected.push({ label: step.label, result });
            send({
              type: "step_result",
              nodeId: step.id,
              label: step.label,
              summary: result.summary,
              detail: result.detail,
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            send({
              type: "step_error",
              nodeId: step.id,
              label: step.label,
              summary: `Failed: ${message}`,
            });
          }
        }

        // Final answer: compose from step results via LLM, streamed.
        const contextText = collected
          .map((c) => `### Step: ${c.label}\nSummary: ${c.result.summary}\n${c.result.detail}`)
          .join("\n\n");

        send({ type: "answer_start" });

        if (!apiKey) {
          const fallback = collected
            .map((c) => `**${c.label}** — ${c.result.summary}\n\n${c.result.detail}`)
            .join("\n\n");
          send({ type: "token", content: fallback });
          send({ type: "complete", response: fallback });
        } else {
          let full = "";
          for await (const chunk of streamGroq(
            [
              {
                role: "system",
                content:
                  "You are the NEXUS-3D workflow executor. Given a task and the results of the workflow steps that were executed, write the final answer for the user. Be concise and concrete, reference the actual findings, and use markdown. Do not invent facts beyond the step results.",
              },
              {
                role: "user",
                content: `Task: ${task}\n\nStep results:\n${contextText}`,
              },
            ],
            { maxTokens: 2048 }
          )) {
            full += chunk;
            send({ type: "token", content: chunk });
          }
          send({ type: "complete", response: full });
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
