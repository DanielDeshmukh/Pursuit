import { NextRequest, NextResponse } from "next/server";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

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
                text: `Look at this portrait photo. Is there any visible background BEHIND the person (walls, scenery, objects, gradient, anything)? If YES (anything that is not pure transparent/empty), set hasBackground to true. Only set hasBackground to false if the image is a transparent PNG with no background at all.

Also analyze:
- shoulderOffset: horizontal shoulder tilt from center (-1.0 left to 1.0 right, 0 = centered)
- headPosition: vertical head position (-1.0 too high, 1.0 too low, 0 = centered)
- recommendedCrop: {x, y, width, height} as percentages 0-100 for best headshot crop
- quality: "good", "fair", or "poor"

Return ONLY valid JSON:
{"hasBackground":true,"backgroundType":"complex","personVisible":true,"shoulderOffset":0.1,"headPosition":-0.05,"recommendedCrop":{"x":10,"y":5,"width":80,"height":85},"quality":"good"}`,
              },
            ],
          },
        ],
        max_tokens: 256,
        temperature: 0.2,
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

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[image-analyze] no JSON found in:", content);
      return NextResponse.json({ error: "Could not parse analysis", raw: content }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    console.log("[image-analyze] parsed:", analysis);
    return NextResponse.json(analysis);
  } catch (e) {
    console.error("[image-analyze]", e);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
