import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

let client: Anthropic | null = null;

/** Lazily construct the client so the app can boot without a key set. */
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file (see .env.example)."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

/** Run a single-turn completion and return the model's text output. */
export async function callClaude(
  prompt: string,
  maxTokens = 2000
): Promise<string> {
  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return text;
}

/**
 * Run a completion that is expected to return JSON, and parse it.
 * Tolerates models that wrap JSON in ```json fences or add stray prose.
 */
export async function callClaudeJSON<T>(
  prompt: string,
  maxTokens = 2000
): Promise<T> {
  const raw = await callClaude(prompt, maxTokens);
  return parseJSON<T>(raw);
}

/** Extract and parse the first JSON object/array found in a string. */
export function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall back to grabbing the outermost {...} or [...] block.
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(
      `Claude did not return valid JSON. Raw response:\n${raw.slice(0, 500)}`
    );
  }
}

export { MODEL };
