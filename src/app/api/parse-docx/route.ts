import { NextRequest, NextResponse } from "next/server";
import { parseDocxToReportData } from "@/lib/parse-docx";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    if (
      !file.name.endsWith(".docx") ||
      file.type !==
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return NextResponse.json(
        { error: ".docx 파일만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const reportData = await parseDocxToReportData(buffer);

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("DOCX parse error:", error);
    const message =
      error instanceof Error ? error.message : "파일 파싱에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
