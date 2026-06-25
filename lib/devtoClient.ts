import { PublishResult } from "@/lib/types";
import { safeErrorMessage } from "@/lib/utils";

export async function publishDevtoArticle(input: {
  title: string;
  bodyMarkdown: string;
  published?: boolean;
  tags?: string[];
  coverImage?: string;
}): Promise<PublishResult> {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) {
    return {
      platform: "devto",
      success: false,
      message: "DEVTO_API_KEY is missing."
    };
  }

  try {
    const response = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        article: {
          title: input.title,
          body_markdown: input.bodyMarkdown,
          published: input.published ?? false,
          tags: input.tags ?? [],
          main_image: input.coverImage || undefined
        }
      })
    });

    const data = (await response.json()) as { id?: number; url?: string; title?: string; error?: string };
    if (!response.ok) {
      throw new Error(data.error || `${response.status} ${response.statusText}`);
    }

    return {
      platform: "devto",
      success: true,
      message: input.published ? "Published to Dev.to." : "Draft created on Dev.to.",
      externalId: data.id ? String(data.id) : undefined,
      url: data.url
    };
  } catch (error: unknown) {
    return {
      platform: "devto",
      success: false,
      message: safeErrorMessage(error)
    };
  }
}