import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    linkedin: {
      configured: Boolean(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_MEMBER_URN)
    },
    devto: {
      configured: Boolean(process.env.DEVTO_API_KEY)
    }
  });
}