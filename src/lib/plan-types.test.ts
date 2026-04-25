import { describe, it, expect } from "vitest";
import {
  createEmptyPlan,
  createEmptyMilestone,
  createEmptyPlanTask,
  generatePlanFileName,
  TASK_STATUS_LABEL,
  type ProjectPlanData,
} from "./plan-types";

describe("createEmpty* factories", () => {
  it("createEmptyPlanTask defaults to status 'todo' with empty fields", () => {
    const t = createEmptyPlanTask();
    expect(t.id).toBeTruthy();
    expect(t.title).toBe("");
    expect(t.status).toBe("todo");
    expect(t.assignee).toBe("");
    expect(t.dateFrom).toBe("");
    expect(t.dateTo).toBe("");
    expect(t.notes).toBe("");
  });

  it("createEmptyMilestone seeds one task and unique id", () => {
    const m = createEmptyMilestone();
    expect(m.tasks).toHaveLength(1);
    expect(m.id).not.toBe(m.tasks[0].id);
  });

  it("createEmptyPlan seeds one milestone and today as createdDate", () => {
    const p = createEmptyPlan();
    expect(p.milestones).toHaveLength(1);
    expect(p.createdDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(p.title).toBe("");
  });

  it("createEmptyPlan ids are all distinct (plan/milestone/task)", () => {
    const p = createEmptyPlan();
    const ids = new Set([p.milestones[0].id, p.milestones[0].tasks[0].id]);
    expect(ids.size).toBe(2);
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
    startDate: "",
    endDate: "",
    milestones: [],
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
