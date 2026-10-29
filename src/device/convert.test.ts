import { describe, expect, it } from "vitest";
import { base64ToBytes, rgbaToGray, toPhotoMeta } from "./convert";

describe("rgbaToGray", () => {
  it("turns pixels into one brightness number each", () => {
    // white, black, pure red (red counts for about 30%)
    const rgba = new Uint8Array([255, 255, 255, 255, 0, 0, 0, 255, 255, 0, 0, 255]);
    const gray = rgbaToGray(rgba);
    expect(gray).toHaveLength(3);
    expect(gray[0]).toBeCloseTo(255, 0);
    expect(gray[1]).toBe(0);
    expect(gray[2]).toBeCloseTo(76.2, 0);
  });
});

describe("toPhotoMeta", () => {
  const asset = { id: "1", filename: "IMG_1.jpg", width: 4000, height: 3000, creationTime: 1_700_000_000_000 };

  it("copies the basics", () => {
    expect(toPhotoMeta(asset, {})).toEqual({
      id: "1", filename: "IMG_1.jpg", width: 4000, height: 3000, takenAt: 1_700_000_000_000,
      lat: undefined, lon: undefined, hasCameraExif: false,
    });
  });

  it("reads GPS from the asset info", () => {
    const m = toPhotoMeta(asset, { location: { latitude: -6.2, longitude: 106.8 } });
    expect([m.lat, m.lon]).toEqual([-6.2, 106.8]);
  });

  it("treats a camera Make in EXIF as camera data", () => {
    expect(toPhotoMeta(asset, { exif: { Make: "Google" } }).hasCameraExif).toBe(true);
  });
});

describe("base64ToBytes", () => {
  it("decodes base64 into bytes", () => {
    expect(Array.from(base64ToBytes("AQID"))).toEqual([1, 2, 3]);
  });
});
