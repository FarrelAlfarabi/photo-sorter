export interface PhotoMeta {
  id: string;
  /** Capture time, milliseconds since epoch. */
  takenAt: number;
  lat?: number;
  lon?: number;
  width: number;
  height: number;
  filename: string;
  /** True when the file has a camera make/model in its EXIF. Screenshots do not. */
  hasCameraExif?: boolean;
}

/** Numbers worked out from the pixels of each photo (see analysis.ts). */
export interface PhotoAnalysis {
  /** 64-bit difference hash as 16 hex characters. */
  hash: string;
  /** Laplacian variance. Higher means sharper. */
  sharpness: number;
}
