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
  stakeholders: [{ id: "s1", name: "전병일", role: "PM", responsibility: "owner" }],
  deliverables: "설계서, API, UI",
  nonGoals: "외부 SSO 통합",
  openQuestions: [{ id: "q1", question: "외부 SSO 적용 시기는?", resolved: false, resolution: "" }],
  northStar: "권한 변경 평균 처리 시간 1일 → 1시간",
  successMetrics: [
    {
      id: "m1",
      name: "권한 변경 처리 시간",
      target: "1시간 이내",
      method: "감사로그 집계",
      timeline: "출시 후 4주",
    },
  ],
  startDate: "2026-05-01",
  endDate: "2026-07-31",
  scheduleEntries: [
    {
      id: "e1",
      title: "현행 권한 분석",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-07",
      details: "DB 스키마 포함",
      assignee: "전병일",
      status: "in_progress",
    },
  ],
  risks: [
    {
      id: "r1",
      description: "데이터 마이그레이션 복잡도",
      impact: "high",
      likelihood: "medium",
      mitigation: "사전 정제 스크립트",
    },
  ],
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

  it("includes title, metadata, and renumbered section headings (Phase 4)", async () => {
    const buffer = await generatePlanDocxBuffer(sample);
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("비즈메카 인사 모듈 개편");
    expect(xml).toContain("개발2팀");
    expect(xml).toContain("전병일");
    expect(xml).toContain("이해관계자"); // 헤더 영역 (번호 없음)
    expect(xml).toContain("1. 배경 / 필요성");
    expect(xml).toContain("4. 산출물");
    expect(xml).toContain("5. 범위 외 (Non-goals)");
    expect(xml).toContain("6. 미결사항");
    expect(xml).toContain("7. 일정");
    expect(xml).toContain("8. 리스크");
    expect(xml).toContain("9. 기타");
  });

  it("renders stakeholders table", async () => {
    const buffer = await generatePlanDocxBuffer(sample);
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("PM");
    expect(xml).toContain("오너");
  });

  it("renders open questions with checkbox glyph", async () => {
    const buffer = await generatePlanDocxBuffer(sample);
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("☐ 외부 SSO 적용 시기는?");
  });

  it("renders Phase 3 risks table with score and Korean labels", async () => {
    const buffer = await generatePlanDocxBuffer(sample);
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("데이터 마이그레이션 복잡도");
    expect(xml).toContain("사전 정제 스크립트");
    expect(xml).toContain("높음"); // impact
    expect(xml).toContain("중간"); // likelihood
    expect(xml).toContain("점수");
  });

  it("renders Phase 2 North Star + 성공 지표 table", async () => {
    const buffer = await generatePlanDocxBuffer(sample);
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("🌟 North Star");
    expect(xml).toContain("권한 변경 평균 처리 시간 1일 → 1시간");
    expect(xml).toContain("성공 지표");
    expect(xml).toContain("권한 변경 처리 시간");
    expect(xml).toContain("출시 후 4주");
  });

  it("includes schedule table with entry and status label", async () => {
    const buffer = await generatePlanDocxBuffer(sample);
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("현행 권한 분석");
    expect(xml).toContain("진행중");
    expect(xml).toContain("기간");
    expect(xml).toContain("담당");
    expect(xml).toContain("상태");
  });

  it("handles empty entries with placeholder row", async () => {
    const buffer = await generatePlanDocxBuffer({ ...sample, scheduleEntries: [] });
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("등록된 일정 없음");
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
