import { NextRequest, NextResponse } from "next/server";
import { callOpenAI, isOpenAIAvailable } from "@/lib/ai/openai-client";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// gpt-4o-mini supports image input, so we can hand it a food photo and ask
// for a structured nutrition estimate.
const PROMPT = `You are a nutrition estimation assistant. Analyze the food/drink in this image.
Identify each distinct food or drink item you can see. For EACH item, estimate the nutrition.

Respond with ONLY valid JSON (no markdown, no code fences) in EXACTLY this shape:
{
  "items": [
    { "name": string, "portion": string, "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": "high" | "medium" | "low" }
  ],
  "totalCalories": number,
  "note": string
}

Rules for FRESH/PLATED food:
- Estimate nutrition for the portion actually visible (not a generic database serving).
- "portion" is a short human description of the visible amount, e.g. "1 medium apple", "~150g grilled chicken", "1 cup rice".

Rules for PACKAGED/BRANDED products (soft drink bottles, cans, chip packets, chocolate bars, etc.):
- Read the brand and the package size printed on the label (e.g. "Thums Up 750 ml", "Coca-Cola 330 ml can", "Lay's 52 g").
- "name" must include the brand (e.g. "Thums Up"). "portion" must state the labeled container size.
- Use the manufacturer's standard nutrition for that product at that size. If the size isn't readable, assume the most common retail size for that product in its market and say so in "note".
- If the container looks empty or partially consumed, STILL identify the product and return nutrition for the FULL labeled container — the user likely consumed it. Mention "looks empty/partially consumed; logged as full container" in "note".
- NEVER return zero calories or refuse just because the contents aren't visible — the packaging is the evidence. Confidence is "high" when the label is clearly readable.

General:
- "calories" is for the stated portion. "protein", "carbs", "fat" are grams for that portion.
- "confidence" reflects image quality and portion ambiguity.
- "totalCalories" is the sum of all item calories, rounded.
- "note" is one short sentence. Keep it under 120 chars.
- Only if there is truly no identifiable food, drink, or food packaging: return {"items": [], "totalCalories": 0, "note": "No food detected in the image."}.
Be realistic and concise.`;

interface ScannedItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "high" | "medium" | "low";
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
}

function sanitizeItems(raw: unknown): ScannedItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      const o = (it ?? {}) as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name.trim() : "";
      if (!name) return null;
      const confidence =
        o.confidence === "high" || o.confidence === "low" ? o.confidence : "medium";
      return {
        name,
        portion: typeof o.portion === "string" ? o.portion.trim() : "",
        calories: Math.round(num(o.calories)),
        protein: num(o.protein),
        carbs: num(o.carbs),
        fat: num(o.fat),
        confidence,
      } as ScannedItem;
    })
    .filter((x): x is ScannedItem => x !== null)
    .slice(0, 12);
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Sometimes the model wraps prose around the JSON — grab the first {...} block.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`food-scan:${clientKey(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many scans — give it a minute and try again." },
      { status: 429 }
    );
  }

  if (!isOpenAIAvailable()) {
    return NextResponse.json(
      { error: "AI food scanning isn't configured (missing OpenAI API key)." },
      { status: 500 }
    );
  }

  let image: string | undefined;
  try {
    const body = await req.json();
    image = typeof body?.image === "string" ? body.image : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!image) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }

  if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,[\s\S]+$/.test(image)) {
    return NextResponse.json(
      { error: "Image must be a base64 data URL." },
      { status: 400 }
    );
  }

  try {
    const res = await callOpenAI({
      prompt: PROMPT,
      imageDataUrl: image,
      imageDetail: "high",
      temperature: 0.2,
      maxTokens: 1024,
      jsonMode: true,
    });

    if (!res.ok || !res.text) {
      return NextResponse.json(
        { error: "The food scanner is unavailable right now. Try again." },
        { status: 502 }
      );
    }

    const parsed = extractJson(res.text) as
      | { items?: unknown; totalCalories?: unknown; note?: unknown }
      | null;

    if (!parsed) {
      return NextResponse.json(
        { error: "Couldn't read the food in that photo. Try a clearer shot." },
        { status: 422 }
      );
    }

    const items = sanitizeItems(parsed.items);
    const totalCalories =
      items.length > 0 ? items.reduce((sum, it) => sum + it.calories, 0) : 0;
    const note =
      typeof parsed.note === "string" ? parsed.note.slice(0, 160) : "";

    return NextResponse.json({ items, totalCalories, note });
  } catch (e) {
    console.error("food-scan:", e);
    return NextResponse.json(
      { error: "Failed to analyze the image." },
      { status: 500 }
    );
  }
}
