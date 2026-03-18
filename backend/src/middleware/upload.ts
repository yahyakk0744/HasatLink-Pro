import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { optimizeImage, createThumbnail } from '../utils/imageOptimizer';
import { uploadToS3, isS3Configured } from '../utils/s3Upload';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `diagnosis-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Sadece JPEG, PNG, WebP ve HEIC formatları desteklenir'));
};

const diagnosisUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');

/**
 * After optimization, if S3 is configured, upload to S3 and
 * replace the local path with the S3 URL.
 */
async function tryUploadToS3(req: Request): Promise<void> {
  if (!req.file || !isS3Configured()) return;

  try {
    const localPath = req.file.path;
    const s3Key = `uploads/${req.file.filename}`;
    const s3Url = await uploadToS3(localPath, s3Key);

    // Replace multer's local path info with the S3 URL
    req.file.path = s3Url;
    (req.file as any).s3Key = s3Key;
    (req.file as any).s3Url = s3Url;

    // Also upload the thumbnail if it exists
    const thumbPath = localPath.replace('.webp', '-thumb.webp');
    if (fs.existsSync(thumbPath)) {
      const thumbKey = s3Key.replace('.webp', '-thumb.webp');
      await uploadToS3(thumbPath, thumbKey);
    }
  } catch (error) {
    // If S3 upload fails, keep the local file and continue
    console.error('S3 upload failed, falling back to local storage:', error);
  }
}

/** Post-upload optimization: optimize image + create thumbnail */
async function optimizeUploaded(filePath: string): Promise<void> {
  const ext = path.extname(filePath);
  const base = filePath.slice(0, -ext.length);
  const optimizedPath = `${base}.webp`;
  const thumbPath = `${base}-thumb.webp`;

  try {
    await optimizeImage(filePath, optimizedPath);
    await createThumbnail(filePath, thumbPath);

    // Remove original if it was converted to a different format
    if (optimizedPath !== filePath && fs.existsSync(optimizedPath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    // If optimization fails, keep the original file
    console.error('[ImageOptimizer] Optimization failed, keeping original:', err);
  }
}

export const uploadDiagnosis = (req: Request, res: Response, next: NextFunction): void => {
  diagnosisUpload(req, res, async (err) => {
    if (err) return next(err);
    if (req.file) {
      await optimizeUploaded(req.file.path);
      // Update file info to point to optimized version
      const ext = path.extname(req.file.path);
      const base = req.file.path.slice(0, -ext.length);
      const optimizedPath = `${base}.webp`;
      if (fs.existsSync(optimizedPath)) {
        req.file.path = optimizedPath;
        req.file.filename = path.basename(optimizedPath);
      }
      // Upload to S3 if configured
      await tryUploadToS3(req);
    }
    next();
  });
};

const adStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `ad-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const adUploadMulter = multer({
  storage: adStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');

export const uploadAdImage = (req: Request, res: Response, next: NextFunction): void => {
  adUploadMulter(req, res, async (err) => {
    if (err) return next(err);
    if (req.file) {
      await optimizeUploaded(req.file.path);
      const ext = path.extname(req.file.path);
      const base = req.file.path.slice(0, -ext.length);
      const optimizedPath = `${base}.webp`;
      if (fs.existsSync(optimizedPath)) {
        req.file.path = optimizedPath;
        req.file.filename = path.basename(optimizedPath);
      }
      // Upload to S3 if configured
      await tryUploadToS3(req);
    }
    next();
  });
};
