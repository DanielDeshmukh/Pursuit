/**
 * Client-side image alignment using canvas.
 * Crops to just head and shoulders, centered in the badge circle.
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
 * Crops to head and shoulders only, outputs transparent PNG.
 */
export async function alignPhoto(
  photoBase64: string,
  analysis: AnalysisData,
  outputSize = 200,
): Promise<string> {
  const img = await loadImage(photoBase64);

  // Use AI recommended crop, or default to top 60% (head+shoulders zone)
  const rc = analysis.recommendedCrop;
  const cropX = (rc.x / 100) * img.width;
  const cropY = (rc.y / 100) * img.height;
  const cropW = (rc.width / 100) * img.width;
  const cropH = (rc.height / 100) * img.height;

  // Nudge by shoulder offset to center the person
  const maxNudge = outputSize * 0.1;
  const nudgeX = analysis.shoulderOffset * maxNudge;

  // Scale crop to fill output square
  const scale = Math.max(outputSize / cropW, outputSize / cropH);
  const scaledW = cropW * scale;
  const scaledH = cropH * scale;

  const destX = (outputSize - scaledW) / 2 + nudgeX;
  const destY = (outputSize - scaledH) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d")!;

  // Transparent background — badge has its own dark bg
  ctx.clearRect(0, 0, outputSize, outputSize);
  ctx.drawImage(img, cropX, cropY, cropW, cropH, destX, destY, scaledW, scaledH);

  // PNG with transparency, compressed to fit DB
  return canvas.toDataURL("image/png");
}
