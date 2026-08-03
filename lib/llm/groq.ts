const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGroq(
  messages: GroqMessage[],
  options?: { temperature?: number; maxTokens?: number; stream?: boolean }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function* streamGroq(
  messages: GroqMessage[],
  options?: { temperature?: number; maxTokens?: number }
): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error ${response.status}: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip invalid lines
        }
      }
    }
  }
}

export const GROQ_SYSTEM_PROMPT = `You are NEXUS-3D, an advanced AI agent control center. You help users with:
- GitHub repository analysis and code review
- Docker configuration optimization
- Deployment planning and CI/CD
- Bug detection and fixing
- Web research and information gathering
- Database analysis

You are concise, technical, and direct. You provide actionable insights.
When analyzing code or configs, point out specific issues with file paths and line references.
Format responses with clear sections and code blocks when needed.`;
