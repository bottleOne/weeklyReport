import { describe, it, expect } from "vitest";
import { ProjectPlanDataSchema } from "./plan-schemas";

describe("ProjectPlanDataSchema — Phase 1 backward compatibility", () => {
  // 새 필드(nonGoals, openQuestions)가 없는 v2 localStorage payload도
  // zod default 덕분에 정상 파싱되어야 한다.
  it("parses legacy v2 payload missing nonGoals/openQuestions and fills defaults", () => {
    const v2Payload = {
      title: "기존 기획서",
      authorName: "전병일",
      teamName: "개발2팀",
      createdDate: "2026-04-25",
      background: "",
      objective: "",
      scope: "",
      stakeholders: "",
      deliverables: "",
      startDate: "",
      endDate: "",
      scheduleEntries: [],
      risks: "기존 risks 텍스트",
      etc: "",
    };

    const parsed = ProjectPlanDataSchema.parse(v2Payload);
    expect(parsed.nonGoals).toBe("");
    expect(parsed.openQuestions).toEqual([]);
    expect(parsed.title).toBe("기존 기획서");
    expect(parsed.risks).toBe("기존 risks 텍스트");
  });

  it("preserves provided nonGoals and openQuestions when present", () => {
    const payload = {
      title: "",
      authorName: "",
      teamName: "",
      createdDate: "2026-05-01",
      background: "",
      objective: "",
      scope: "",
      stakeholders: "",
      deliverables: "",
      nonGoals: "예: 모바일 미지원",
      openQuestions: [
        { id: "q1", question: "auth 방식?", resolved: false, resolution: "" },
        { id: "q2", question: "DB 선택?", resolved: true, resolution: "Postgres" },
      ],
      startDate: "",
      endDate: "",
      scheduleEntries: [],
      risks: "",
      etc: "",
    };

    const parsed = ProjectPlanDataSchema.parse(payload);
    expect(parsed.nonGoals).toBe("예: 모바일 미지원");
    expect(parsed.openQuestions).toHaveLength(2);
    expect(parsed.openQuestions[1]).toEqual({
      id: "q2",
      question: "DB 선택?",
      resolved: true,
      resolution: "Postgres",
    });
  });
});
