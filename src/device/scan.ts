// Talks to the phone (photo library, image shrinking). Not unit tested: it needs a real device.
// All the decisions live in src/core, which is tested.
import * as MediaLibrary from "expo-media-library/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import jpeg from "jpeg-js";
import { dHash, downsampleGray, laplacianVariance } from "../core/analysis";
import type { PhotoAnalysis, PhotoMeta } from "../core/types";
import { base64ToBytes, rgbaToGray, toPhotoMeta } from "./convert";

const W = 90;
const H = 80;

export interface ScanResult {
  photos: PhotoMeta[];
  analysis: Record<string, PhotoAnalysis>;
}

export async function ensurePermission(): Promise<boolean> {
  const res = await MediaLibrary.requestPermissionsAsync();
  return res.granted;
}

/** Reads the most recent `limit` photos and works out time, place, hash and sharpness for each. */
export async function scanLibrary(limit: number, onProgress: (done: number, total: number) => void): Promise<ScanResult> {
  const page = await MediaLibrary.getAssetsAsync({
    first: limit,
    mediaType: "photo",
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });
  const photos: PhotoMeta[] = [];
  const analysis: Record<string, PhotoAnalysis> = {};

  let done = 0;
  for (const asset of page.assets) {
    const info = await MediaLibrary.getAssetInfoAsync(asset);
    photos.push(toPhotoMeta(asset, info));
    try {
      const small = await manipulateAsync(info.localUri ?? asset.uri, [{ resize: { width: W, height: H } }], {
        format: SaveFormat.JPEG,
        base64: true,
        compress: 0.9,
      });
      const decoded = jpeg.decode(base64ToBytes(small.base64!), { useTArray: true });
      const gray = rgbaToGray(decoded.data);
      analysis[asset.id] = {
        hash: dHash(downsampleGray(gray, decoded.width, decoded.height, 9, 8)),
        sharpness: laplacianVariance(gray, decoded.width, decoded.height),
      };
    } catch {
      // Leave this photo without analysis: it is never flagged as blurry or duplicate.
    }
    onProgress(++done, page.assets.length);
  }
  return { photos, analysis };
}

export async function createTripAlbum(name: string, assetIds: string[]): Promise<void> {
  const [first, ...rest] = assetIds;
  const album = await MediaLibrary.createAlbumAsync(name, first, true);
  if (rest.length) await MediaLibrary.addAssetsToAlbumAsync(rest, album, true);
}

/** Android asks the user to confirm. Returns false if they decline. */
export async function deletePhotos(assetIds: string[]): Promise<boolean> {
  return MediaLibrary.deleteAssetsAsync(assetIds);
}
