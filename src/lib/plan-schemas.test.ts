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
      // Phase 3 이전: risks는 string
      risks: "외부 API 지연\n인력 부족",
      etc: "",
    };

    const parsed = ProjectPlanDataSchema.parse(v2Payload);
    expect(parsed.nonGoals).toBe("");
    expect(parsed.openQuestions).toEqual([]);
    expect(parsed.title).toBe("기존 기획서");
    // Phase 3 마이그레이션: risks string → RiskItem[]로 자동 변환
    expect(Array.isArray(parsed.risks)).toBe(true);
    expect(parsed.risks).toHaveLength(2);
    expect(parsed.risks[0].description).toBe("외부 API 지연");
    expect(parsed.risks[0].impact).toBe("medium");
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
      risks: "", // 빈 string도 허용 → []
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
    expect(parsed.risks).toEqual([]);
  });
});

describe("ProjectPlanDataSchema — Phase 3 risks migration & v3 raw", () => {
  const baseV3 = {
    title: "",
    authorName: "",
    teamName: "",
    createdDate: "2026-05-07",
    background: "",
    objective: "",
    scope: "",
    stakeholders: "",
    deliverables: "",
    nonGoals: "",
    openQuestions: [],
    northStar: "",
    successMetrics: [],
    startDate: "",
    endDate: "",
    scheduleEntries: [],
    etc: "",
  };

  it("accepts v3 raw risks array as-is", () => {
    const payload = {
      ...baseV3,
      risks: [
        {
          id: "r1",
          description: "외부 API 지연",
          impact: "high",
          likelihood: "medium",
          mitigation: "캐시 fallback",
        },
      ],
    };
    const parsed = ProjectPlanDataSchema.parse(payload);
    expect(parsed.risks).toHaveLength(1);
    expect(parsed.risks[0].impact).toBe("high");
    expect(parsed.risks[0].mitigation).toBe("캐시 fallback");
  });

  it("treats missing risks field as empty array (default)", () => {
    const parsed = ProjectPlanDataSchema.parse(baseV3);
    expect(parsed.risks).toEqual([]);
  });
});

describe("ProjectPlanDataSchema — Phase 2 backward compatibility", () => {
  it("parses payload missing Phase 2 fields and fills empty defaults", () => {
    const payload = {
      title: "",
      authorName: "",
      teamName: "",
      createdDate: "2026-05-07",
      background: "",
      objective: "",
      scope: "",
      stakeholders: "",
      deliverables: "",
      // Phase 1만 있고 Phase 2 (northStar, successMetrics) 누락
      nonGoals: "",
      openQuestions: [],
      startDate: "",
      endDate: "",
      scheduleEntries: [],
      risks: "",
      etc: "",
    };

    const parsed = ProjectPlanDataSchema.parse(payload);
    expect(parsed.northStar).toBe("");
    expect(parsed.successMetrics).toEqual([]);
  });

  it("preserves provided northStar and successMetrics", () => {
    const payload = {
      title: "",
      authorName: "",
      teamName: "",
      createdDate: "2026-05-07",
      background: "",
      objective: "",
      scope: "",
      stakeholders: "",
      deliverables: "",
      nonGoals: "",
      openQuestions: [],
      northStar: "보고서 작성 시간 75% 단축",
      successMetrics: [
        {
          id: "m1",
          name: "주간 활성 사용자",
          target: "300명",
          method: "GA",
          timeline: "출시 후 4주",
        },
      ],
      startDate: "",
      endDate: "",
      scheduleEntries: [],
      risks: "",
      etc: "",
    };

    const parsed = ProjectPlanDataSchema.parse(payload);
    expect(parsed.northStar).toBe("보고서 작성 시간 75% 단축");
    expect(parsed.successMetrics).toHaveLength(1);
    expect(parsed.successMetrics[0].target).toBe("300명");
  });
});
