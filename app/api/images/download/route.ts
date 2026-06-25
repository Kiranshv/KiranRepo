import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getContentRowByRunDateKey } from "@/lib/repositories/contentRepository";
import { slugifyTopic } from "@/lib/utils";

const schema = z.object({
  runDateKey: z.string().min(1),
  variant: z.enum(["linkedin", "medium", "instagram"])
});

function getImageUrlForVariant(params: {
  variant: "linkedin" | "medium" | "instagram";
  linkedInImageUrl: string;
  mediumImageUrl: string;
  igImageUrl: string;
}): string {
  switch (params.variant) {
    case "linkedin":
      return params.linkedInImageUrl;
    case "medium":
      return params.mediumImageUrl;
    case "instagram":
      return params.igImageUrl;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const parsed = schema.parse({
      runDateKey: request.nextUrl.searchParams.get("runDateKey") ?? "",
      variant: request.nextUrl.searchParams.get("variant") ?? ""
    });

    const row = await getContentRowByRunDateKey(parsed.runDateKey);
    if (!row) {
      return NextResponse.json({ success: false, message: "Content row not found." }, { status: 404 });
    }

    const sourceUrl = getImageUrlForVariant({
      variant: parsed.variant,
      linkedInImageUrl: row.linkedInImageUrl,
      mediumImageUrl: row.mediumImageUrl,
      igImageUrl: row.igImageUrl
    });

    if (!sourceUrl) {
      return NextResponse.json({ success: false, message: "Image not available for this variant yet." }, { status: 404 });
    }

    const upstream = await fetch(sourceUrl, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, message: `Failed to fetch source image: ${upstream.status} ${upstream.statusText}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/png";
    const extension = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    const fileName = `${parsed.runDateKey}-${slugifyTopic(row.topic)}-${parsed.variant}.${extension}`;

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=\"${fileName}\"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
