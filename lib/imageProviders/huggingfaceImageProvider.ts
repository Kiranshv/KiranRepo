import https from "https";

import { ImageProvider } from "@/lib/imageProviders/imageProvider";
import { ImageProviderName } from "@/lib/types";
import { safeErrorMessage } from "@/lib/utils";

const HUGGING_FACE_ENDPOINTS = ["https://router.huggingface.co/hf-inference/models"] as const;

function requestImage(params: { url: string; apiKey: string; prompt: string }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const request = https.request(
      params.url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
          Accept: "image/png"
        }
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          const body = Buffer.concat(chunks);
          if ((response.statusCode ?? 500) >= 400) {
            reject(new Error(body.toString("utf8") || `${response.statusCode} ${response.statusMessage}`));
            return;
          }

          if (body.byteLength === 0) {
            reject(new Error("Hugging Face returned an empty image response."));
            return;
          }

          resolve(body);
        });
      }
    );

    request.on("error", (error) => reject(error));
    request.write(
      JSON.stringify({
        inputs: params.prompt,
        parameters: {
          negative_prompt:
            "text, words, letters, numbers, typography, captions, title, headline, watermark, logo, signature, code, UI copy, paragraph blocks, subtitles, misspelling, gibberish text, monitor, laptop, phone screen, dashboard, document page, app icon, poster, signboard",
          guidance_scale: 8,
          num_inference_steps: 28
        }
      })
    );
    request.end();
  });
}

export class HuggingFaceImageProvider implements ImageProvider {
  readonly providerName: ImageProviderName = "huggingface";

  async generateImage(input: { prompt: string }): Promise<Buffer> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error("Hugging Face image generation is not configured.");
    }

    const model = process.env.HUGGINGFACE_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";

    try {
      let lastError: string | null = null;

      for (const baseUrl of HUGGING_FACE_ENDPOINTS) {
        try {
          return await requestImage({
            url: `${baseUrl}/${model}`,
            apiKey,
            prompt: input.prompt
          });
        } catch (error: unknown) {
          lastError = safeErrorMessage(error);
        }
      }

      throw new Error(lastError || "Hugging Face image generation failed.");
    } catch (error: unknown) {
      throw new Error(`Hugging Face image generation failed: ${safeErrorMessage(error)}`);
    }
  }
}