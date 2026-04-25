import { type NextRequest, NextResponse } from "next/server";
import { generatePlanDocxBuffer } from "@/lib/generate-plan-docx";
import { generatePlanFileName } from "@/lib/plan-types";
import { ProjectPlanDataSchema } from "@/lib/plan-schemas";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = ProjectPlanDataSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "기획서 데이터 형식이 올바르지 않습니다.",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const buffer = await generatePlanDocxBuffer(data);
    const fileName = generatePlanFileName(data, "docx");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": DOCX_MIME,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error("Plan DOCX generation error:", error);
    return NextResponse.json({ error: "Failed to generate plan DOCX" }, { status: 500 });
  }
}
