import { NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@imgly/background-removal";
import sharp from "sharp";

const OUTPUT_WIDTH = 384;
const OUTPUT_HEIGHT = 324;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert data URI or base64 to Buffer
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const inputBuffer = Buffer.from(base64Data, "base64");

    console.log("[image-process] Step 1: Removing background...");

    // Step 1: Remove background
    const cleanBlob = await removeBackground(inputBuffer, {
      progress: (key, current, total) => {
        if (total > 0) {
          console.log(`[image-process]   ${key}: ${Math.round((current / total) * 100)}%`);
        }
      },
    });

    const cleanBuffer = Buffer.from(await cleanBlob.arrayBuffer());

    console.log("[image-process] Step 2: Analyzing cutout dimensions...");

    // Get metadata of the clean cutout
    const meta = await sharp(cleanBuffer).metadata();
    const imgW = meta.width || 1000;
    const imgH = meta.height || 1000;

    // Step 2: Find the bounding box of the non-transparent content
    // Read raw pixel data to find where the subject actually is
    const raw = await sharp(cleanBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = 4;
    let minY = imgH, maxY = 0, minX = imgW, maxX = 0;
    let hasContent = false;

    for (let y = 0; y < imgH; y++) {
      for (let x = 0; x < imgW; x++) {
        const alpha = raw.data[(y * imgW + x) * channels + 3];
        if (alpha > 10) {
          hasContent = true;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }

    if (!hasContent) {
      return NextResponse.json({ error: "No subject found in image" }, { status: 400 });
    }

    console.log(`[image-process] Subject bbox: x=${minX}, y=${minY}, w=${maxX - minX}, h=${maxY - minY}`);

    // Step 3: Crop to subject bounding box
    const bboxW = maxX - minX;
    const bboxH = maxY - minY;
    const padding = 10;

    const croppedBuffer = await sharp(cleanBuffer)
      .extract({
        left: Math.max(0, minX - padding),
        top: Math.max(0, minY - padding),
        width: Math.min(imgW - Math.max(0, minX - padding), bboxW + padding * 2),
        height: Math.min(imgH - Math.max(0, minY - padding), bboxH + padding * 2),
      })
      .toBuffer();

    const croppedMeta = await sharp(croppedBuffer).metadata();
    const cropW = croppedMeta.width || bboxW;
    const cropH = croppedMeta.height || bboxH;

    // Step 4: Scale and position subject right-of-center
    // Subject fills 60% of width (right side), left 40% is empty for rating overlay
    const targetSubjectWidth = OUTPUT_WIDTH * 0.6;
    const targetSubjectHeight = OUTPUT_HEIGHT * 0.85;
    const scale = Math.min(targetSubjectWidth / cropW, targetSubjectHeight / cropH);
    const finalW = Math.round(cropW * scale);
    const finalH = Math.round(cropH * scale);

    // Position: centered horizontally in right 60%, anchored at top with headroom
    const destX = Math.round(OUTPUT_WIDTH * 0.35 + (targetSubjectWidth - finalW) / 2);
    const destY = Math.round(OUTPUT_HEIGHT * 0.05);

    console.log(`[image-process] Scaled subject: ${finalW}x${finalH}, placed at (${destX}, ${destY})`);

    // Step 5: Composite onto transparent canvas with warm color grading
    const subjectResized = await sharp(croppedBuffer)
      .resize(finalW, finalH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Apply subtle warm color grade (increase red channel slightly, boost saturation)
    const warmBuffer = await sharp(subjectResized)
      .modulate({ brightness: 1.02, saturation: 1.08 })
      .toBuffer();

    // Create transparent output canvas and composite the subject
    const output = await sharp({
      create: {
        width: OUTPUT_WIDTH,
        height: OUTPUT_HEIGHT,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{
        input: warmBuffer,
        left: destX,
        top: destY,
      }])
      .png()
      .toBuffer();

    console.log("[image-process] Step 6: Encoding output...");

    const dataUri = `data:image/png;base64,${output.toString("base64")}`;

    console.log(`[image-process] Done. Output size: ${output.length} bytes`);

    return NextResponse.json({ image: dataUri });
  } catch (e) {
    console.error("[image-process]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Processing failed" },
      { status: 500 },
    );
  }
}
