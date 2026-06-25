import { createActivityLog } from "@/lib/repositories/activityLogRepository";
import {
  getContentRowByRunDateKey,
  setContentStatus,
  updateContentRowByRunDateKey,
  updateImageFields
} from "@/lib/repositories/contentRepository";
import { getImageProvider } from "@/lib/imageProviders/imageProviderFactory";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { GeneratedImageResult, ImageProviderName, ImageVariant } from "@/lib/types";
import { buildImageStoragePath, safeErrorMessage, slugifyTopic } from "@/lib/utils";

const STORAGE_BUCKET = "content-images";

function buildTopicKeywords(topic: string): string {
  return topic
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3)
    .slice(0, 8)
    .join(", ");
}

function buildBaseImagePrompt(topic: string): string {
  const keywords = buildTopicKeywords(topic);

  return [
    `Topic concept: ${topic}.`,
    keywords ? `Key ideas to imply visually: ${keywords}.` : "Focus on evaluation, automation, and AI workflow concepts.",
    "Create a text-free conceptual illustration that communicates the idea symbolically instead of spelling anything out.",
    "Do not render any words, letters, numbers, captions, labels, logos, watermarks, code snippets, UI copy, or typographic shapes.",
    "Avoid title areas, headline layouts, poster compositions, banners, signage, app icons, and any design that invites text placement.",
    "Avoid computers, laptops, phones, monitors, dashboards, document pages, control panels, or framed UI surfaces because they often produce unwanted text.",
    "Use clean iconography, flow lines, evaluation signals, data nodes, automation links, orbiting shapes, and abstract analytics motifs.",
    "Prioritize visual accuracy, strong composition, crisp details, professional lighting, and a polished product-illustration style.",
    "Avoid misspelled text, gibberish typography, distorted letters, cluttered overlays, and faux UI paragraphs."
  ].join(" ");
}

function buildPrompt(variant: ImageVariant, topic: string): string {
  const base = buildBaseImagePrompt(topic);

  switch (variant) {
    case "linkedin":
      return `${base} Create a wide professional hero illustration for a business audience with abstract AI workflow symbols, evaluation checkpoints, network nodes, and automation connections. Use a clean focal subject, generous negative space, and no devices, screens, or text elements.`;
    case "medium":
      return `${base} Create a cinematic editorial illustration with a restrained palette, diagrammatic flow, and one central metaphor for model evaluation moving through an automated workflow. Use abstract geometry, connected nodes, and charts as shapes only. No monitors, pages, or headline blocks.`;
    case "instagram":
      return `${base} Create a bold square concept composition using icons, gauges, linked nodes, arrows, and high-contrast technical motifs only. Make it energetic and modern, but avoid any letters, monograms, title-like blocks, screens, or brand-like marks.`;
  }
}

async function uploadImageBuffer(params: {
  runDateKey: string;
  topic: string;
  variant: ImageVariant;
  imageBuffer: Buffer;
}): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const path = buildImageStoragePath({
    runDateKey: params.runDateKey,
    topicSlug: slugifyTopic(params.topic),
    variant: params.variant
  });

  const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, params.imageBuffer, {
    cacheControl: "3600",
    contentType: "image/png",
    upsert: true
  });

  if (uploadError) {
    throw new Error(`Failed to upload image to storage: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function toImagePatch(result: GeneratedImageResult): {
  linkedInImageUrl?: string;
  mediumImageUrl?: string;
  igImageUrl?: string;
} {
  switch (result.variant) {
    case "linkedin":
      return { linkedInImageUrl: result.imageUrl };
    case "medium":
      return { mediumImageUrl: result.imageUrl };
    case "instagram":
      return { igImageUrl: result.imageUrl };
  }
}

function allImagesPresent(row: {
  linkedInImageUrl: string;
  mediumImageUrl: string;
  igImageUrl: string;
}): boolean {
  return [row.linkedInImageUrl, row.mediumImageUrl, row.igImageUrl].every((value) => value.trim().length > 0);
}

export async function generateImagesForRow(params: {
  runDateKey: string;
  variants: ImageVariant[];
  provider?: ImageProviderName;
}): Promise<void> {
  const row = await getContentRowByRunDateKey(params.runDateKey);
  if (!row) {
    throw new Error(`No content row found for ${params.runDateKey}.`);
  }
  if (!row.topic.trim()) {
    throw new Error(`Content row ${params.runDateKey} has no topic.`);
  }

  const provider = getImageProvider(params.provider);
  const generatedAt = new Date().toISOString();
  const successes: GeneratedImageResult[] = [];
  const failures: string[] = [];

  await setContentStatus(params.runDateKey, "Imaging", "ImageGenerator");
  await createActivityLog({
    runDateKey: row.runDateKey,
    contentRowId: row.id,
    agent: "ImageGenerator",
    action: "started",
    details: `Generating ${params.variants.join(", ")} images with ${provider.providerName}.`
  });

  for (const variant of params.variants) {
    try {
      const imageBuffer = await provider.generateImage({
        prompt: buildPrompt(variant, row.topic),
        variant
      });

      const imageUrl = await uploadImageBuffer({
        runDateKey: row.runDateKey,
        topic: row.topic,
        variant,
        imageBuffer
      });

      const result: GeneratedImageResult = {
        variant,
        provider: provider.providerName,
        imageUrl
      };
      successes.push(result);

      await updateImageFields(row.runDateKey, {
        ...toImagePatch(result),
        imageProvider: provider.providerName,
        imageGeneratedAt: generatedAt,
        imageError: failures.join(" | ")
      });

      await createActivityLog({
        runDateKey: row.runDateKey,
        contentRowId: row.id,
        agent: "ImageGenerator",
        action: `${variant}_generated`,
        details: imageUrl
      });
    } catch (error: unknown) {
      const message = `${variant}: ${safeErrorMessage(error)}`;
      failures.push(message);
      await createActivityLog({
        runDateKey: row.runDateKey,
        contentRowId: row.id,
        agent: "ImageGenerator",
        action: `${variant}_failed`,
        details: message
      });
    }
  }

  const updatedRow = successes.length > 0 ? await getContentRowByRunDateKey(row.runDateKey) : row;
  const nextStatus = failures.length > 0 ? "DoneWithImageError" : "Done";

  await updateContentRowByRunDateKey(row.runDateKey, {
    status: failures.length > 0 ? "DoneWithImageError" : allImagesPresent(updatedRow ?? row) ? "Done" : nextStatus,
    imageProvider: provider.providerName,
    imageGeneratedAt: successes.length > 0 ? generatedAt : row.imageGeneratedAt,
    imageError: failures.join(" | "),
    lastAgent: "ImageGenerator"
  });

  if (failures.length > 0) {
    throw new Error(`One or more image generations failed: ${failures.join(" | ")}`);
  }
}

export async function generateLinkedInImageForRow(runDateKey: string, provider?: ImageProviderName): Promise<void> {
  await generateImagesForRow({ runDateKey, variants: ["linkedin"], provider });
}

export async function generateMediumImageForRow(runDateKey: string, provider?: ImageProviderName): Promise<void> {
  await generateImagesForRow({ runDateKey, variants: ["medium"], provider });
}

export async function generateInstagramImageForRow(runDateKey: string, provider?: ImageProviderName): Promise<void> {
  await generateImagesForRow({ runDateKey, variants: ["instagram"], provider });
}