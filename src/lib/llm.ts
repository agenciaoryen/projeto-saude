/**
 * Shared LLM call — currently DeepSeek, with fallback-ready structure.
 * To add fallback: add try/catch and switch provider on failure.
 */

export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number; jsonOnly?: boolean }
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const maxTokens = options?.maxTokens ?? 500;
  const temperature = options?.temperature ?? 0.7;

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
        { role: "user", content: userMessage },
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
