// Server-only OpenAI client (gpt-4o-mini). OPENAI_API_KEY must never be
// exposed with a NEXT_PUBLIC_ prefix — all client features go through /api/*
// routes that proxy the model.

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

interface LLMRequest {
  prompt: string;
  /** Optional base64 data URL — sent as image input for vision tasks. */
  imageDataUrl?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

interface LLMResponse {
  text: string;
  ok: boolean;
}

function getApiKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
}

export function isOpenAIAvailable(): boolean {
  const key = getApiKey();
  return !!key && key !== "placeholder" && key.length > 10;
}

export async function callOpenAI(req: LLMRequest): Promise<LLMResponse> {
  const apiKey = getApiKey();
  if (!apiKey) return { text: "", ok: false };

  const content: unknown = req.imageDataUrl
    ? [
        { type: "text", text: req.prompt },
        { type: "image_url", image_url: { url: req.imageDataUrl } },
      ]
    : req.prompt;

  const body: Record<string, unknown> = {
    model: MODEL,
    messages: [{ role: "user", content }],
    max_tokens: req.maxTokens ?? 200,
    temperature: req.temperature ?? 0.7,
  };

  if (req.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) return { text: "", ok: false };

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  return { text: text || "", ok: !!text };
}
