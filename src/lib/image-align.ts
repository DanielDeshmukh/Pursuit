/**
 * Client-side image alignment using canvas.
 * Uses AI analysis data to center shoulders/head for the circular badge photo.
 */

export type AnalysisData = {
  shoulderOffset: number;
  headPosition: number;
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
 * Aligns and crops a photo so the person's shoulders are centered for the
 * badge's circular clip area.
 *
 * @param photoBase64  data-URI or raw base64 of the source image
 * @param analysis     output from /api/image/analyze
 * @param outputSize   pixel width/height of the square canvas (default 512)
 * @returns            data-URI of the processed PNG
 */
export async function alignPhoto(
  photoBase64: string,
  analysis: AnalysisData,
  outputSize = 512,
): Promise<string> {
  const img = await loadImage(photoBase64);

  // --- 1. Apply recommended crop region (percentages 0-100) ---
  const rc = analysis.recommendedCrop;
  const cropX = (rc.x / 100) * img.width;
  const cropY = (rc.y / 100) * img.height;
  const cropW = (rc.width / 100) * img.width;
  const cropH = (rc.height / 100) * img.height;

  // --- 2. Compute the destination rectangle inside the output canvas ---
  // The badge circle is centered; nudge horizontally by shoulderOffset
  // and vertically by headPosition so the shoulders line up.
  const maxNudge = outputSize * 0.15; // max 15 % of canvas
  const nudgeX = analysis.shoulderOffset * maxNudge;
  const nudgeY = analysis.headPosition * maxNudge;

  // Scale the cropped region to fill the output square
  const scale = Math.max(outputSize / cropW, outputSize / cropH);
  const scaledW = cropW * scale;
  const scaledH = cropH * scale;

  const destX = (outputSize - scaledW) / 2 + nudgeX;
  const destY = (outputSize - scaledH) / 2 + nudgeY;

  // --- 3. Draw to canvas ---
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d")!;

  // Transparent background (badge already has its own bg)
  ctx.clearRect(0, 0, outputSize, outputSize);
  ctx.drawImage(img, cropX, cropY, cropW, cropH, destX, destY, scaledW, scaledH);

  return canvas.toDataURL("image/png", 0.92);
}
