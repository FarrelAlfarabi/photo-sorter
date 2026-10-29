import { describe, expect, it } from "vitest";
import { looksLikeScreenshot } from "./screenshots";

const base = { id: "x", takenAt: 0, width: 4000, height: 3000, filename: "IMG_0001.jpg", hasCameraExif: true };

describe("looksLikeScreenshot", () => {
  it("catches the word screenshot in the filename", () => {
    expect(looksLikeScreenshot({ ...base, filename: "Screenshot_20260601-101010.png" })).toBe(true);
    expect(looksLikeScreenshot({ ...base, filename: "Screen Shot 2026.png" })).toBe(true);
  });
  it("catches a phone-screen shape with no camera data", () => {
    expect(looksLikeScreenshot({ ...base, width: 1080, height: 2400, hasCameraExif: false })).toBe(true);
  });
  it("does not flag a normal camera photo", () => {
    expect(looksLikeScreenshot(base)).toBe(false);
  });
  it("does not flag a tall photo that has camera data", () => {
    expect(looksLikeScreenshot({ ...base, width: 3000, height: 6000 })).toBe(false);
  });
  it("does not flag a no-camera-data photo with a normal photo shape", () => {
    expect(looksLikeScreenshot({ ...base, hasCameraExif: false })).toBe(false);
  });
});
