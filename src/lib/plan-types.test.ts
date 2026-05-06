import { describe, it, expect } from "vitest";
import {
  createEmptyOpenQuestion,
  createEmptyPlan,
  createEmptyScheduleEntry,
  createEmptySuccessMetric,
  createScheduleEntryFromRange,
  generatePlanFileName,
  sortOpenQuestions,
  sortScheduleEntriesByStart,
  TASK_STATUS_LABEL,
  type OpenQuestionItem,
  type ProjectPlanData,
  type PlanScheduleEntry,
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
    risks: "",
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
