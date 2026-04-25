import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { generatePlanDocxBuffer } from "./generate-plan-docx";
import type { ProjectPlanData } from "./plan-types";

const sample: ProjectPlanData = {
  title: "비즈메카 인사 모듈 개편",
  authorName: "전병일",
  teamName: "개발2팀",
  createdDate: "2026-04-25",
  background: "현행 권한 체계의 한계",
  objective: "권한 관리 표준화",
  scope: "포함: 권한 모델",
  stakeholders: "기획팀, 보안팀",
  deliverables: "설계서, API, UI",
  startDate: "2026-05-01",
  endDate: "2026-07-31",
  milestones: [
    {
      id: "m1",
      title: "요구사항 확정",
      description: "이해관계자 인터뷰",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-15",
      tasks: [
        {
          id: "t1",
          title: "현행 권한 분석",
          assignee: "전병일",
          dateFrom: "2026-05-01",
          dateTo: "2026-05-07",
          status: "in_progress",
          notes: "DB 스키마 포함",
        },
      ],
    },
  ],
  risks: "데이터 마이그레이션 복잡도",
  etc: "",
};

async function extractDocumentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("word/document.xml not found");
  return xml;
}

describe("generatePlanDocxBuffer", () => {
  it("returns a non-empty docx buffer", async () => {
    const buffer = await generatePlanDocxBuffer(sample);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("includes title, metadata, and section headings", async () => {
    const buffer = await generatePlanDocxBuffer(sample);
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("비즈메카 인사 모듈 개편");
    expect(xml).toContain("개발2팀");
    expect(xml).toContain("전병일");
    expect(xml).toContain("1. 배경 / 필요성");
    expect(xml).toContain("6. 일정");
    expect(xml).toContain("8. 기타");
  });

  it("includes milestone title and task with status label", async () => {
    const buffer = await generatePlanDocxBuffer(sample);
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("요구사항 확정");
    expect(xml).toContain("현행 권한 분석");
    expect(xml).toContain("진행중");
  });

  it("matches structural snapshot", async () => {
    const buffer = await generatePlanDocxBuffer(sample);
    const xml = await extractDocumentXml(buffer);
    const tagSequence = xml
      .match(/<\/?w:[a-zA-Z]+/g)
      ?.slice(0, 100)
      .join(" ");
    expect(tagSequence).toMatchSnapshot();
  });
});
