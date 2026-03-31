import { NextRequest, NextResponse } from "next/server";
import { generateDocxBuffer } from "@/lib/generate-docx";
import type { ReportData } from "@/lib/types";
import { generateFileName } from "@/lib/types";

// PDF generation: We generate the docx buffer server-side
// For true PDF, the client-side will use html2canvas + jsPDF approach
// This endpoint provides a fallback server-rendered docx that can be opened
export async function POST(request: NextRequest) {
  try {
    const data: ReportData = await request.json();
    const buffer = await generateDocxBuffer(data);
    const fileName = generateFileName(data, "docx");

    // Return docx buffer - client will handle PDF conversion
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
