import { type Description, parseDescription } from "./parse.ts";

/** The one place that talks to an AI model. Swap the implementation (e.g. Claude Haiku) without touching callers. */
export interface VisionModel {
  describeImage(base64: string, mimeType: string): Promise<Description>;
}

const MODEL = "gemini-flash-latest";
const URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const PROMPT =
  'Describe this photo for a photo organiser. Reply with JSON only: {"description": "<one short sentence>", "tags": ["<3 to 6 lowercase words such as food, selfie, beach, outfit, view, document>"]}';

export function geminiModel(apiKey: string, fetchFn: typeof fetch = fetch): VisionModel {
  return {
    async describeImage(base64, mimeType) {
      const res = await fetchFn(`${URL_BASE}/${MODEL}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      if (!res.ok) throw new Error(`Gemini request failed with status ${res.status}`);
      const json = await res.json();
      return parseDescription(json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
    },
  };
}
