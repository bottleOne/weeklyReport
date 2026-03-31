import { NextRequest, NextResponse } from "next/server";
import { generateDocxBuffer } from "@/lib/generate-docx";
import type { ReportData } from "@/lib/types";
import { generateFileName } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const data: ReportData = await request.json();
    const buffer = await generateDocxBuffer(data);
    const fileName = generateFileName(data, "docx");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("DOCX generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate DOCX" },
      { status: 500 }
    );
  }
}
