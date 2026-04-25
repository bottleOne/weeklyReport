import { type NextRequest, NextResponse } from "next/server";
import { generateDocxBuffer } from "@/lib/generate-docx";
import { generateFileName } from "@/lib/types";
import { ReportDataSchema } from "@/lib/schemas";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = ReportDataSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "보고서 데이터 형식이 올바르지 않습니다.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const buffer = await generateDocxBuffer(data);
    const fileName = generateFileName(data, "docx");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": DOCX_MIME,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("DOCX generation error:", error);
    return NextResponse.json({ error: "Failed to generate DOCX" }, { status: 500 });
  }
}
