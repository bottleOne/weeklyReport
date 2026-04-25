import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { generateDocxBuffer } from "./generate-docx";
import type { ReportData } from "./types";

/**
 * 회귀 방지: docx 출력의 핵심 구조가 변하지 않는지 보증.
 * 스냅샷이 깨지면 의도된 변경인지 확인 후 `vitest -u`로 갱신.
 */

const baseEmployee: ReportData = {
  mode: "employee",
  meetingDate: "2026-04-25",
  teamName: "개발2팀",
  authorName: "전병일",
  thisWeekTasks: [
    {
      id: "t1",
      title: "비즈메카 인사",
      contentLines: [
        {
          id: "c1",
          text: "사용자 권한 개편",
          dateFrom: "2026-04-20",
          dateTo: "2026-04-25",
          subDetails: [{ id: "s1", text: "RBAC 설계", dateFrom: "", dateTo: "" }],
        },
      ],
    },
  ],
  nextWeekTasks: [
    {
      id: "t2",
      title: "회계 모듈 점검",
      contentLines: [
        { id: "c2", text: "분기 결산 검증", dateFrom: "", dateTo: "", subDetails: [] },
      ],
    },
  ],
  members: [],
  targetBusiness: "kt비즈메카",
  requestTeam: "기획팀",
  devPeriodFrom: "2026-04-01",
  devPeriodTo: "2026-04-25",
  nextTargetBusiness: "kt비즈메카",
  nextRequestTeam: "기획팀",
  nextDevPeriodFrom: "2026-04-26",
  nextDevPeriodTo: "2026-05-02",
  issues: "특이사항 없음",
  etc: "",
};

const baseLeader: ReportData = {
  ...baseEmployee,
  mode: "leader",
  members: [
    {
      id: "m1",
      name: "김팀원",
      thisWeekTasks: baseEmployee.thisWeekTasks,
      nextWeekTasks: baseEmployee.nextWeekTasks,
    },
  ],
  thisWeekTasks: [],
  nextWeekTasks: [],
};

/** docx 버퍼에서 word/document.xml 만 추출. 바이너리 메타(zip 압축률, 타임스탬프)는 제외. */
async function extractDocumentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("word/document.xml not found");
  return xml;
}

describe("generateDocxBuffer", () => {
  it("returns a non-empty docx buffer for employee mode", async () => {
    const buffer = await generateDocxBuffer(baseEmployee);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("includes core fields in document.xml (employee)", async () => {
    const buffer = await generateDocxBuffer(baseEmployee);
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("개발2팀");
    expect(xml).toContain("전병일");
    expect(xml).toContain("비즈메카 인사");
    expect(xml).toContain("사용자 권한 개편");
    expect(xml).toContain("RBAC 설계");
    expect(xml).toContain("kt비즈메카");
    expect(xml).toContain("기획팀");
  });

  it("includes member tasks in document.xml (leader)", async () => {
    const buffer = await generateDocxBuffer(baseLeader);
    const xml = await extractDocumentXml(buffer);
    expect(xml).toContain("김팀원");
    expect(xml).toContain("비즈메카 인사");
  });

  it("matches structural snapshot for employee mode", async () => {
    const buffer = await generateDocxBuffer(baseEmployee);
    const xml = await extractDocumentXml(buffer);
    // 구조 회귀 감지: tag 시퀀스만 보존 (값은 위 it()에서 검증).
    const tagSequence = xml
      .match(/<\/?w:[a-zA-Z]+/g)
      ?.slice(0, 100)
      .join(" ");
    expect(tagSequence).toMatchSnapshot();
  });

  it("matches structural snapshot for leader mode", async () => {
    const buffer = await generateDocxBuffer(baseLeader);
    const xml = await extractDocumentXml(buffer);
    const tagSequence = xml
      .match(/<\/?w:[a-zA-Z]+/g)
      ?.slice(0, 100)
      .join(" ");
    expect(tagSequence).toMatchSnapshot();
  });
});
