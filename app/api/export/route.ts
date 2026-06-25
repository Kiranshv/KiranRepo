import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

import { getAllContentRows } from "@/lib/repositories/contentRepository";
import { isSupabaseAdminConfigured } from "@/lib/utils";

export async function GET(): Promise<NextResponse> {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY, then apply supabase/schema.sql."
        },
        { status: 503 }
      );
    }

    const rows = await getAllContentRows();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("ContentRows");

    sheet.columns = [
      { header: "Date", key: "date", width: 14 },
      { header: "RunDateKey", key: "runDateKey", width: 16 },
      { header: "Topic", key: "topic", width: 40 },
      { header: "Status", key: "status", width: 20 },
      { header: "LinkedIn Publish", key: "linkedInPublishStatus", width: 18 },
      { header: "Dev.to Publish", key: "devtoPublishStatus", width: 18 },
      { header: "UpdatedAt", key: "updatedAt", width: 28 }
    ];

    rows.forEach((row) => {
      sheet.addRow({
        date: row.date,
        runDateKey: row.runDateKey,
        topic: row.topic,
        status: row.status,
        linkedInPublishStatus: row.linkedInPublishStatus,
        devtoPublishStatus: row.devtoPublishStatus,
        updatedAt: row.updatedAt
      });
    });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=contentforge-export.xlsx"
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}