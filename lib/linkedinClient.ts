import { PublishResult } from "@/lib/types";
import { safeErrorMessage } from "@/lib/utils";

export async function publishLinkedInPost(input: {
  text: string;
  imageUrl?: string;
}): Promise<PublishResult> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const memberUrn = process.env.LINKEDIN_MEMBER_URN;

  if (!accessToken || !memberUrn) {
    return {
      platform: "linkedin",
      success: false,
      message: "LinkedIn credentials are not configured."
    };
  }

  try {
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
      },
      body: JSON.stringify({
        author: memberUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: input.imageUrl ? `${input.text}\n\nImage: ${input.imageUrl}` : input.text
            },
            shareMediaCategory: "NONE"
          }
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `${response.status} ${response.statusText}`);
    }

    const postId = response.headers.get("x-restli-id") || undefined;
    return {
      platform: "linkedin",
      success: true,
      message: input.imageUrl
        ? "Published text post to LinkedIn. Image URL was included as a reference for later extension."
        : "Published text post to LinkedIn.",
      externalId: postId
    };
  } catch (error: unknown) {
    return {
      platform: "linkedin",
      success: false,
      message: safeErrorMessage(error)
    };
  }
}