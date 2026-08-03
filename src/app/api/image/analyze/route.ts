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
                text: `Analyze this portrait photo for a FIFA Ultimate Team style badge card.

The final image must show ONLY the person's head and upper torso (shoulders + chest), centered, with NO background. Think of a FIFA player card: the person's head is near the top, shoulders extend to the sides, and the image cuts off at mid-chest.

Return JSON only:
{"hasBackground":<true if walls/scenery/objects visible behind person, false if already transparent or solid color>,"backgroundType":"<solid|gradient|complex|none>","shoulderOffset":<-1.0 person is far left, 0.0 centered, 1.0 person is far right>,"recommendedCrop":{"x":<0-100 percentage, left edge of the person's body (include shoulders)>,"y":<0-100 percentage, top of the head (leave small margin)>,"width":<0-100 percentage, width from left shoulder to right shoulder>,"height":<0-100 percentage, from top of head to mid-chest level>}}

CRITICAL:
- x should include BOTH shoulders (full width of body at shoulder level)
- y should start at the TOP OF THE HEAD (not above it)
- height should reach MID-CHEST (not the waist, not the full body)
- width should cover the full shoulder span
- shoulderOffset: 0.0 if the person's body is centered in the frame`,
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
      shoulderOffset: 0,
      recommendedCrop: { x: 10, y: 0, width: 80, height: 55 },
    });
  } catch (e) {
    console.error("[image-analyze]", e);
    return NextResponse.json({
      hasBackground: true,
      backgroundType: "complex",
      shoulderOffset: 0,
      recommendedCrop: { x: 10, y: 0, width: 80, height: 55 },
      quality: "fair",
    });
  }
}
