import { describe, it, expect } from "vitest";
import {
  computeRiskScore,
  createEmptyOpenQuestion,
  createEmptyPlan,
  createEmptyRisk,
  createEmptyScheduleEntry,
  createEmptyStakeholder,
  createEmptySuccessMetric,
  createScheduleEntryFromRange,
  generatePlanFileName,
  legacyRisksTextToItems,
  legacyStakeholdersTextToItems,
  sortOpenQuestions,
  sortRisksByScore,
  sortScheduleEntriesByStart,
  TASK_STATUS_LABEL,
  type OpenQuestionItem,
  type ProjectPlanData,
  type PlanScheduleEntry,
  type RiskItem,
} from "./plan-types";

describe("createEmpty* factories", () => {
  it("createEmptyScheduleEntry defaults to status 'todo' with empty fields", () => {
    const e = createEmptyScheduleEntry();
    expect(e.id).toBeTruthy();
    expect(e.title).toBe("");
    expect(e.status).toBe("todo");
    expect(e.assignee).toBe("");
    expect(e.dateFrom).toBe("");
    expect(e.dateTo).toBe("");
    expect(e.details).toBe("");
  });

  it("createEmptyPlan starts with empty entries and today as createdDate", () => {
    const p = createEmptyPlan();
    expect(p.scheduleEntries).toEqual([]);
    expect(p.createdDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.title).toBe("");
  });

  it("createEmptyPlan includes Phase 1 fields with empty defaults", () => {
    const p = createEmptyPlan();
    expect(p.nonGoals).toBe("");
    expect(p.openQuestions).toEqual([]);
  });

  it("createEmptyPlan includes Phase 2 fields with empty defaults", () => {
    const p = createEmptyPlan();
    expect(p.northStar).toBe("");
    expect(p.successMetrics).toEqual([]);
  });

  it("createEmptyPlan exposes risks as empty array (Phase 3)", () => {
    const p = createEmptyPlan();
    expect(p.risks).toEqual([]);
  });

  it("createEmptyRisk defaults to medium/medium with blank text", () => {
    const r = createEmptyRisk();
    expect(r.id).toBeTruthy();
    expect(r.description).toBe("");
    expect(r.impact).toBe("medium");
    expect(r.likelihood).toBe("medium");
    expect(r.mitigation).toBe("");
  });

  it("createEmptyPlan exposes stakeholders as empty array (Phase 4)", () => {
    const p = createEmptyPlan();
    expect(p.stakeholders).toEqual([]);
  });

  it("createEmptyStakeholder defaults to contributor with blank text", () => {
    const s = createEmptyStakeholder();
    expect(s.id).toBeTruthy();
    expect(s.name).toBe("");
    expect(s.role).toBe("");
    expect(s.responsibility).toBe("contributor");
  });

  it("createEmptyOpenQuestion defaults to unresolved with blank fields", () => {
    const q = createEmptyOpenQuestion();
    expect(q.id).toBeTruthy();
    expect(q.question).toBe("");
    expect(q.resolved).toBe(false);
    expect(q.resolution).toBe("");
  });

  it("createEmptySuccessMetric defaults to blank fields with id", () => {
    const m = createEmptySuccessMetric();
    expect(m.id).toBeTruthy();
    expect(m.name).toBe("");
    expect(m.target).toBe("");
    expect(m.method).toBe("");
    expect(m.timeline).toBe("");
  });
});

describe("createScheduleEntryFromRange", () => {
  it("uses both dates when provided", () => {
    const e = createScheduleEntryFromRange("2026-04-25", "2026-04-30");
    expect(e.dateFrom).toBe("2026-04-25");
    expect(e.dateTo).toBe("2026-04-30");
    expect(e.status).toBe("todo");
  });

  it("falls back to dateFrom when dateTo is empty (single day)", () => {
    const e = createScheduleEntryFromRange("2026-04-25", "");
    expect(e.dateFrom).toBe("2026-04-25");
    expect(e.dateTo).toBe("2026-04-25");
  });
});

describe("TASK_STATUS_LABEL", () => {
  it("covers all status values", () => {
    expect(TASK_STATUS_LABEL.todo).toBe("예정");
    expect(TASK_STATUS_LABEL.in_progress).toBe("진행중");
    expect(TASK_STATUS_LABEL.done).toBe("완료");
    expect(TASK_STATUS_LABEL.blocked).toBe("지연");
  });
});

describe("generatePlanFileName", () => {
  const base: ProjectPlanData = {
    title: "신규 인사 모듈",
    authorName: "전병일",
    teamName: "개발2팀",
    createdDate: "2026-04-25",
    stakeholders: [],
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
    risks: [],
    etc: "",
  };

  it("formats {date}_프로젝트기획서_{team}_{title}.{ext}", () => {
    expect(generatePlanFileName(base, "docx")).toBe(
      "20260425_프로젝트기획서_개발2팀_신규 인사 모듈.docx"
    );
  });

  it("falls back to placeholders when team/title empty", () => {
    expect(generatePlanFileName({ ...base, teamName: "", title: "" }, "md")).toBe(
      "20260425_프로젝트기획서_팀_기획서.md"
    );
  });
});

describe("sortScheduleEntriesByStart", () => {
  const e = (id: string, dateFrom: string): PlanScheduleEntry => ({
    id,
    title: "",
    dateFrom,
    dateTo: "",
    details: "",
    assignee: "",
    status: "todo",
  });

  it("sorts by dateFrom ascending", () => {
    const sorted = sortScheduleEntriesByStart([
      e("c", "2026-05-01"),
      e("a", "2026-04-01"),
      e("b", "2026-04-15"),
    ]);
    expect(sorted.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("places empty dateFrom at the end", () => {
    const sorted = sortScheduleEntriesByStart([e("a", ""), e("b", "2026-04-01"), e("c", "")]);
    expect(sorted[0].id).toBe("b");
  });

  it("does not mutate input", () => {
    const input = [e("c", "2026-05-01"), e("a", "2026-04-01")];
    const inputCopy = [...input];
    sortScheduleEntriesByStart(input);
    expect(input).toEqual(inputCopy);
  });
});

describe("Risk helpers (Phase 3)", () => {
  const r = (
    id: string,
    impact: RiskItem["impact"],
    likelihood: RiskItem["likelihood"]
  ): RiskItem => ({
    id,
    description: id,
    impact,
    likelihood,
    mitigation: "",
  });

  describe("computeRiskScore", () => {
    it("multiplies impact × likelihood (low=1, medium=2, high=3)", () => {
      expect(computeRiskScore(r("a", "low", "low"))).toBe(1);
      expect(computeRiskScore(r("b", "medium", "medium"))).toBe(4);
      expect(computeRiskScore(r("c", "high", "high"))).toBe(9);
      expect(computeRiskScore(r("d", "high", "medium"))).toBe(6);
      expect(computeRiskScore(r("e", "low", "high"))).toBe(3);
    });
  });

  describe("sortRisksByScore", () => {
    it("sorts by score descending (stable on tie)", () => {
      const items = [
        r("a", "low", "low"), // 1
        r("b", "high", "high"), // 9
        r("c", "medium", "high"), // 6
        r("d", "high", "low"), // 3
      ];
      const sorted = sortRisksByScore(items);
      expect(sorted.map((x) => x.id)).toEqual(["b", "c", "d", "a"]);
    });

    it("does not mutate input", () => {
      const items = [r("a", "low", "low"), r("b", "high", "high")];
      const copy = [...items];
      sortRisksByScore(items);
      expect(items).toEqual(copy);
    });
  });

  describe("legacyRisksTextToItems (v2 → v3 migration)", () => {
    it("returns empty array for empty/whitespace string", () => {
      expect(legacyRisksTextToItems("")).toEqual([]);
      expect(legacyRisksTextToItems("   \n  \n")).toEqual([]);
    });

    it("splits by newline, trims, filters blanks", () => {
      const out = legacyRisksTextToItems("외부 API 지연\n\n  레거시 정합성  \n인력 부족");
      expect(out).toHaveLength(3);
      expect(out.map((x) => x.description)).toEqual([
        "외부 API 지연",
        "레거시 정합성",
        "인력 부족",
      ]);
    });

    it("each migrated item has id, medium/medium defaults, blank mitigation", () => {
      const out = legacyRisksTextToItems("a\nb");
      for (const item of out) {
        expect(item.id).toBeTruthy();
        expect(item.impact).toBe("medium");
        expect(item.likelihood).toBe("medium");
        expect(item.mitigation).toBe("");
      }
    });
  });
});

describe("Stakeholder migration (Phase 4)", () => {
  describe("legacyStakeholdersTextToItems", () => {
    it("returns empty array for empty/whitespace string", () => {
      expect(legacyStakeholdersTextToItems("")).toEqual([]);
      expect(legacyStakeholdersTextToItems("   \n  \n")).toEqual([]);
    });

    it("splits by newline, trims, filters blanks", () => {
      const out = legacyStakeholdersTextToItems("기획팀\n  보안팀  \n\n전병일 (PM)");
      expect(out).toHaveLength(3);
      expect(out.map((x) => x.name)).toEqual(["기획팀", "보안팀", "전병일 (PM)"]);
    });

    it("each migrated item has id, blank role, contributor responsibility", () => {
      const out = legacyStakeholdersTextToItems("a\nb");
      for (const item of out) {
        expect(item.id).toBeTruthy();
        expect(item.role).toBe("");
        expect(item.responsibility).toBe("contributor");
      }
    });
  });
});

describe("sortOpenQuestions", () => {
  const q = (id: string, resolved: boolean): OpenQuestionItem => ({
    id,
    question: id,
    resolved,
    resolution: "",
  });

  it("places unresolved before resolved (stable)", () => {
    const sorted = sortOpenQuestions([q("a", true), q("b", false), q("c", true), q("d", false)]);
    expect(sorted.map((x) => x.id)).toEqual(["b", "d", "a", "c"]);
  });

  it("does not mutate input", () => {
    const input = [q("a", true), q("b", false)];
    const copy = [...input];
    sortOpenQuestions(input);
    expect(input).toEqual(copy);
  });
});
