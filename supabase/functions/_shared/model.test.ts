import { describe, expect, it, vi } from "vitest";
import { geminiModel } from "./model.ts";

const reply = (text: string) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });

describe("geminiModel", () => {
  it("sends the key in a header, never in the URL", async () => {
    const fetchFn = vi.fn().mockResolvedValue(reply('{"description":"Beach","tags":["beach"]}'));
    const model = geminiModel("fake-test-key", fetchFn as unknown as typeof fetch);
    await model.describeImage("AAAA", "image/jpeg");
    const [url, init] = fetchFn.mock.calls[0];
    expect(String(url)).toContain("gemini-flash-latest:generateContent");
    expect(String(url)).not.toContain("fake-test-key");
    expect((init as RequestInit).headers).toMatchObject({ "X-goog-api-key": "fake-test-key" });
  });

  it("sends the image as inline base64 and returns parsed text", async () => {
    const fetchFn = vi.fn().mockResolvedValue(reply('{"description":"Beach","tags":["Beach"]}'));
    const model = geminiModel("k", fetchFn as unknown as typeof fetch);
    const out = await model.describeImage("AAAA", "image/jpeg");
    const body = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string);
    expect(body.contents[0].parts.some((p: any) => p.inline_data?.data === "AAAA")).toBe(true);
    expect(out).toEqual({ description: "Beach", tags: ["beach"] });
  });

  it("throws a plain error when Google says no, without leaking the key", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("quota", { status: 429 }));
    const model = geminiModel("secret-123", fetchFn as unknown as typeof fetch);
    const err = await model.describeImage("AAAA", "image/jpeg").catch((e: Error) => e);
    expect((err as Error).message).toMatch(/429/);
    expect((err as Error).message).not.toContain("secret-123");
  });
});
