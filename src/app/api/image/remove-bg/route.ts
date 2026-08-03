import { NextRequest, NextResponse } from "next/server";

const REMOVEBG_API_KEY = process.env.REMOVALBG_API_KEY || process.env.REMOVEBG_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!REMOVEBG_API_KEY) {
      console.error("[remove-bg] env check:", { REMOVALBG: !!process.env.REMOVALBG_API_KEY, REMOVEBG: !!process.env.REMOVEBG_API_KEY });
      return NextResponse.json({ error: "REMOVALBG_API_KEY not found. Restart dev server after adding to .env" }, { status: 500 });
    }

    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    const formData = new FormData();
    formData.append("image_file_b64", base64Data);
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVEBG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[remove-bg]", err);
      return NextResponse.json({ error: "Background removal failed" }, { status: 502 });
    }

    const result = await response.blob();
    const buffer = Buffer.from(await result.arrayBuffer());
    const base64Result = `data:image/png;base64,${buffer.toString("base64")}`;

    return NextResponse.json({ image: base64Result });
  } catch (e) {
    console.error("[remove-bg]", e);
    return NextResponse.json({ error: "Background removal failed" }, { status: 500 });
  }
}
