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
      // Phase 4 이전: stakeholders는 string
      stakeholders: "기획팀\n보안팀\n전병일",
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
    // Phase 4 마이그레이션: stakeholders string → Stakeholder[]
    expect(Array.isArray(parsed.stakeholders)).toBe(true);
    expect(parsed.stakeholders).toHaveLength(3);
    expect(parsed.stakeholders[0].name).toBe("기획팀");
    expect(parsed.stakeholders[0].responsibility).toBe("contributor");
    // Phase 5 default: status="draft", changeLog=[]
    expect(parsed.status).toBe("draft");
    expect(parsed.changeLog).toEqual([]);
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
      stakeholders: [],
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
    stakeholders: [],
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

describe("ProjectPlanDataSchema — Phase 4 stakeholders migration & raw", () => {
  const base = {
    title: "",
    authorName: "",
    teamName: "",
    createdDate: "2026-05-07",
    background: "",
    objective: "",
    scope: "",
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

  it("accepts raw stakeholders array as-is", () => {
    const payload = {
      ...base,
      stakeholders: [
        { id: "s1", name: "전병일", role: "PM", responsibility: "owner" },
        { id: "s2", name: "이OO", role: "백엔드", responsibility: "contributor" },
      ],
    };
    const parsed = ProjectPlanDataSchema.parse(payload);
    expect(parsed.stakeholders).toHaveLength(2);
    expect(parsed.stakeholders[0].responsibility).toBe("owner");
  });

  it("treats missing stakeholders field as empty array (default)", () => {
    const parsed = ProjectPlanDataSchema.parse(base);
    expect(parsed.stakeholders).toEqual([]);
  });

  it("auto-migrates legacy string stakeholders to array", () => {
    const payload = { ...base, stakeholders: "기획팀\n보안팀" };
    const parsed = ProjectPlanDataSchema.parse(payload);
    expect(parsed.stakeholders).toHaveLength(2);
    expect(parsed.stakeholders[0].name).toBe("기획팀");
    expect(parsed.stakeholders[1].name).toBe("보안팀");
    expect(parsed.stakeholders[0].responsibility).toBe("contributor");
  });
});

describe("ProjectPlanDataSchema — Phase 5 status & changeLog", () => {
  const base = {
    title: "",
    authorName: "",
    teamName: "",
    createdDate: "2026-05-07",
    background: "",
    objective: "",
    scope: "",
    stakeholders: [],
    deliverables: "",
    nonGoals: "",
    openQuestions: [],
    northStar: "",
    successMetrics: [],
    startDate: "",
    endDate: "",
    scheduleEntries: [],
    risks: [],
    etc: "",
  };

  it("missing status defaults to 'draft' and changeLog defaults to []", () => {
    const parsed = ProjectPlanDataSchema.parse(base);
    expect(parsed.status).toBe("draft");
    expect(parsed.changeLog).toEqual([]);
  });

  it("preserves provided status + changeLog entries", () => {
    const payload = {
      ...base,
      status: "approved",
      changeLog: [
        { id: "c1", date: "2026-05-01", author: "전병일", summary: "초안 완료" },
        { id: "c2", date: "2026-05-05", author: "이OO", summary: "리뷰 의견 반영" },
      ],
    };
    const parsed = ProjectPlanDataSchema.parse(payload);
    expect(parsed.status).toBe("approved");
    expect(parsed.changeLog).toHaveLength(2);
    expect(parsed.changeLog[1].summary).toBe("리뷰 의견 반영");
  });

  it("rejects unknown status value", () => {
    const payload = { ...base, status: "wip" as unknown as string };
    expect(() => ProjectPlanDataSchema.parse(payload)).toThrow();
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
