/**
 * Client-side image alignment using canvas.
 * Crops to head + upper torso, outputs image sized for badge top area.
 */

export type AnalysisData = {
  shoulderOffset: number;
  recommendedCrop: { x: number; y: number; width: number; height: number };
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Crops to head + upper torso (FIFA card style), outputs transparent PNG.
 * Badge top area is 384x324. We output at 2x for quality (768x648).
 */
export async function alignPhoto(
  photoBase64: string,
  analysis: AnalysisData,
): Promise<string> {
  const img = await loadImage(photoBase64);

  const outW = 384;
  const outH = 324;

  // Use AI recommended crop
  const rc = analysis.recommendedCrop;
  const cropX = (rc.x / 100) * img.width;
  const cropY = (rc.y / 100) * img.height;
  const cropW = (rc.width / 100) * img.width;
  const cropH = (rc.height / 100) * img.height;

  // Nudge horizontally to center the person
  const maxNudge = outW * 0.1;
  const nudgeX = analysis.shoulderOffset * maxNudge;

  // Scale crop to fill output: person should fill the frame width
  // with head near top and shoulders extending to sides
  const scaleX = outW / cropW;
  const scaleY = outH / cropH;
  const scale = Math.max(scaleX, scaleY);

  const scaledW = cropW * scale;
  const scaledH = cropH * scale;

  // Center horizontally with shoulder offset nudge
  // Anchor vertically so head is near the top
  const destX = (outW - scaledW) / 2 + nudgeX;
  const destY = -cropY * scale * 0.3; // pull up so head is near top edge

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;

  // Transparent background
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(img, cropX, cropY, cropW, cropH, destX, destY, scaledW, scaledH);

  return canvas.toDataURL("image/png");
}
