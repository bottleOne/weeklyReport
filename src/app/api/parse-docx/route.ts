import { type NextRequest, NextResponse } from "next/server";
import { parseDocxToReportData } from "@/lib/parse-docx";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const value = formData.get("file");

    if (!(value instanceof File)) {
      return NextResponse.json({ error: "파일이 선택되지 않았습니다." }, { status: 400 });
    }

    if (!value.name.endsWith(".docx") || value.type !== DOCX_MIME) {
      return NextResponse.json({ error: ".docx 파일만 업로드할 수 있습니다." }, { status: 400 });
    }

    if (value.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 10MB를 초과할 수 없습니다." },
        { status: 413 }
      );
    }

    const buffer = await value.arrayBuffer();
    const reportData = await parseDocxToReportData(buffer);

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("DOCX parse error:", error);
    const message = error instanceof Error ? error.message : "파일 파싱에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
