/**
 * Shared LLM call — currently DeepSeek, with fallback-ready structure.
 * Supports text-only and multimodal (image) messages.
 */

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function callLLM(
  systemPrompt: string,
  userMessage: string | ContentBlock[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const maxTokens = options?.maxTokens ?? 500;
  const temperature = options?.temperature ?? 0.7;

  const userContent = typeof userMessage === "string"
    ? userMessage
    : userMessage;

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM API error (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
