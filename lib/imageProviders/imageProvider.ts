import { ImageProviderName, ImageVariant } from "@/lib/types";

export interface GenerateImageInput {
  prompt: string;
  variant: ImageVariant;
}

export interface ImageProvider {
  readonly providerName: ImageProviderName;
  generateImage(input: GenerateImageInput): Promise<Buffer>;
}