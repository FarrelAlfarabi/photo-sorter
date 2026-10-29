// Optional step: ask the AI for a short description and tags of ONE small preview photo.
// The Gemini key lives in the Supabase secret GEMINI_API_KEY. It is never in the app or in git.
// @ts-nocheck (Deno runtime)
import { geminiModel } from "../_shared/model.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) return new Response("Server is not set up", { status: 500 });
  try {
    const { base64, mimeType } = await req.json();
    if (typeof base64 !== "string" || base64.length > 400_000) {
      return new Response("Send one preview image under about 300 KB", { status: 400 });
    }
    const out = await geminiModel(key).describeImage(base64, mimeType ?? "image/jpeg");
    return Response.json(out);
  } catch (e) {
    return new Response((e as Error).message, { status: 502 });
  }
});
