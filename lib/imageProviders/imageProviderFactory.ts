import { GeminiImageProvider } from "@/lib/imageProviders/geminiImageProvider";
import { HuggingFaceImageProvider } from "@/lib/imageProviders/huggingfaceImageProvider";
import { ImageProvider } from "@/lib/imageProviders/imageProvider";
import { ImageProviderName } from "@/lib/types";
import { getDefaultImageProvider } from "@/lib/utils";

export function getImageProvider(provider?: ImageProviderName): ImageProvider {
  const resolved = provider ?? getDefaultImageProvider();
  return resolved === "gemini" ? new GeminiImageProvider() : new HuggingFaceImageProvider();
}