import { GoogleGenAI } from "@google/genai";

import { ImageProvider } from "@/lib/imageProviders/imageProvider";
import { ImageProviderName } from "@/lib/types";
import { safeErrorMessage } from "@/lib/utils";

function extractImageBuffer(response: unknown): Buffer {
  if (!response || typeof response !== "object") {
    throw new Error("Gemini response was empty.");
  }

  const candidates = Reflect.get(response, "candidates");
  if (!Array.isArray(candidates)) {
    throw new Error("Gemini did not return any image candidates.");
  }

  for (const candidate of candidates) {
    const content = Reflect.get(candidate, "content");
    const parts = content && typeof content === "object" ? Reflect.get(content, "parts") : undefined;
    if (!Array.isArray(parts)) {
      continue;
    }

    for (const part of parts) {
      const inlineData = Reflect.get(part, "inlineData");
      const data = inlineData && typeof inlineData === "object" ? Reflect.get(inlineData, "data") : undefined;
      if (typeof data === "string" && data.length > 0) {
        return Buffer.from(data, "base64");
      }
    }
  }

  throw new Error("Gemini did not return image bytes.");
}

export class GeminiImageProvider implements ImageProvider {
  readonly providerName: ImageProviderName = "gemini";

  async generateImage(input: { prompt: string }): Promise<Buffer> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini image generation is not configured.");
    }

    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

    try {
      const client = new GoogleGenAI({ apiKey });
      const response = await client.models.generateContent({
        model,
        contents: input.prompt,
        config: {
          responseModalities: ["IMAGE", "TEXT"]
        }
      });

      return extractImageBuffer(response);
    } catch (error: unknown) {
      throw new Error(`Gemini image generation failed: ${safeErrorMessage(error)}`);
    }
  }
}