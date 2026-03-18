import sharp from 'sharp';

interface OptimizeOptions {
  maxWidth?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Optimize an image: resize to max width, convert to WebP, quality 80.
 */
export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  options: OptimizeOptions = {}
): Promise<void> {
  const { maxWidth = 1200, quality = 80, format = 'webp' } = options;

  await sharp(inputPath)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .toFormat(format, { quality })
    .toFile(outputPath);
}

/**
 * Create a thumbnail: 300px width, WebP, quality 70.
 */
export async function createThumbnail(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await sharp(inputPath)
    .resize({ width: 300, withoutEnlargement: true })
    .toFormat('webp', { quality: 70 })
    .toFile(outputPath);
}
