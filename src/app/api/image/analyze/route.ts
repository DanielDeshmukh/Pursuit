import { NextRequest, NextResponse } from "next/server";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

function extractJson(text: string): Record<string, unknown> | null {
  // Strip markdown code blocks
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Find the first { ... } block
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const slice = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    // Try fixing common issues: trailing commas, single quotes
    try {
      const fixed = slice.replace(/,\s*([}\]])/g, "$1").replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!NVIDIA_API_KEY) {
      return NextResponse.json({ error: "NVIDIA API key not configured" }, { status: 500 });
    }

    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    const response = await fetch(NVIDIA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
              {
                type: "text",
                text: `Analyze this portrait photo. Return JSON only, no other text.

{"hasBackground":<true if walls/scenery/objects visible behind person, false only if transparent PNG>,"backgroundType":"<solid|gradient|complex|none>","personVisible":<true|false>,"shoulderOffset":<-1.0 to 1.0>,"headPosition":<-1.0 to 1.0>,"recommendedCrop":{"x":<0-100>,"y":<0-100>,"width":<0-100>,"height":<0-100>},"quality":"<good|fair|poor>"}`,
              },
            ],
          },
        ],
        max_tokens: 256,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[image-analyze] NVIDIA API error:", err);
      return NextResponse.json({ error: "Analysis failed" }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log("[image-analyze] raw AI response:", content);

    const parsed = extractJson(content);
    if (parsed) {
      console.log("[image-analyze] parsed:", parsed);
      return NextResponse.json(parsed);
    }

    // Fallback: assume background exists, default alignment
    console.warn("[image-analyze] parse failed, using defaults");
    return NextResponse.json({
      hasBackground: true,
      backgroundType: "complex",
      personVisible: true,
      shoulderOffset: 0,
      headPosition: 0,
      recommendedCrop: { x: 5, y: 0, width: 90, height: 95 },
      quality: "fair",
    });
  } catch (e) {
    console.error("[image-analyze]", e);
    // Fallback instead of erroring out
    return NextResponse.json({
      hasBackground: true,
      backgroundType: "complex",
      personVisible: true,
      shoulderOffset: 0,
      headPosition: 0,
      recommendedCrop: { x: 5, y: 0, width: 90, height: 95 },
      quality: "fair",
    });
  }
}
