import type { PhotoMeta } from "../core/types";

/** The few fields we use from expo-media-library's Asset. */
export interface AssetLike {
  id: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
}

/** The few fields we use from expo-media-library's AssetInfo. */
export interface AssetInfoLike {
  location?: { latitude: number; longitude: number } | null;
  exif?: object | null;
}

export function toPhotoMeta(asset: AssetLike, info: AssetInfoLike): PhotoMeta {
  return {
    id: asset.id,
    filename: asset.filename,
    width: asset.width,
    height: asset.height,
    takenAt: asset.creationTime,
    lat: info.location?.latitude,
    lon: info.location?.longitude,
    hasCameraExif: Boolean(info.exif && (info.exif as Record<string, unknown>)["Make"]),
  };
}

/** Standard luma weights (ITU-R BT.601). Input is RGBA bytes, output one brightness per pixel. */
export function rgbaToGray(rgba: Uint8Array): number[] {
  const out: number[] = [];
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    out.push(0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]);
  }
  return out;
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
