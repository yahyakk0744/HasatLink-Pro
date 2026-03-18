/**
 * Image optimization utilities.
 * Sharp is optional — if not installed, images are used as-is.
 */

let sharp: any = null;
try {
  sharp = require('sharp');
} catch {
  // sharp not available — skip optimization
}

interface OptimizeOptions {
  maxWidth?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  options: OptimizeOptions = {}
): Promise<void> {
  if (!sharp) return; // no-op if sharp not installed
  const { maxWidth = 1200, quality = 80, format = 'webp' } = options;
  await sharp(inputPath)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .toFormat(format, { quality })
    .toFile(outputPath);
}

export async function createThumbnail(
  inputPath: string,
  outputPath: string
): Promise<void> {
  if (!sharp) return; // no-op if sharp not installed
  await sharp(inputPath)
    .resize({ width: 300, withoutEnlargement: true })
    .toFormat('webp', { quality: 70 })
    .toFile(outputPath);
}
