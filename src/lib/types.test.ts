import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  newId,
  getTodayLocal,
  formatDateRange,
  contentLinesToText,
  generateFileName,
  getDayOfWeek,
  createEmptyTask,
  createEmptyContentLine,
  createEmptySubDetail,
  createEmptyMember,
  type ReportData,
} from "./types";

describe("newId", () => {
  it("returns a non-empty string", () => {
    expect(typeof newId()).toBe("string");
    expect(newId().length).toBeGreaterThan(0);
  });

  it("returns unique values across rapid successive calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()));
    expect(ids.size).toBe(1000);
  });
});

describe("getTodayLocal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns YYYY-MM-DD format", () => {
    expect(getTodayLocal()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uses local time, not UTC (KST 1AM should still be today)", () => {
    // 2026-04-25 01:00 KST = 2026-04-24 16:00 UTC
    // UTC-based code would return "2026-04-24". Local code returns "2026-04-25".
    const kstOneAm = new Date("2026-04-25T01:00:00+09:00");
    vi.setSystemTime(kstOneAm);
    // Skip if test runner is not in KST — assert local-day correctness regardless
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
    expect(getTodayLocal()).toBe(expected);
  });
});

describe("formatDateRange", () => {
  it("returns empty string when both dates missing", () => {
    expect(formatDateRange({ dateFrom: "", dateTo: "" })).toBe("");
  });

  it("formats both dates as MM.DD~MM.DD", () => {
    expect(formatDateRange({ dateFrom: "2026-04-25", dateTo: "2026-05-01" })).toBe("04.25~05.01");
  });

  it("formats from-only as MM.DD~", () => {
    expect(formatDateRange({ dateFrom: "2026-04-25", dateTo: "" })).toBe("04.25~");
  });

  it("formats to-only as ~MM.DD", () => {
    expect(formatDateRange({ dateFrom: "", dateTo: "2026-05-01" })).toBe("~05.01");
  });
});

describe("getDayOfWeek", () => {
  it("returns empty string for empty input", () => {
    expect(getDayOfWeek("")).toBe("");
  });

  it("returns Korean weekday for valid date", () => {
    // 2026-04-25 is a Saturday
    expect(getDayOfWeek("2026-04-25")).toBe("토");
  });
});

describe("contentLinesToText", () => {
  it("returns empty string for empty array", () => {
    expect(contentLinesToText([])).toBe("");
  });

  it("renders main text without dates as-is", () => {
    expect(
      contentLinesToText([
        {
          id: "1",
          text: "작업 내용",
          dateFrom: "",
          dateTo: "",
          subDetails: [],
        },
      ])
    ).toBe("작업 내용");
  });

  it("appends formatted date range when present", () => {
    expect(
      contentLinesToText([
        {
          id: "1",
          text: "작업",
          dateFrom: "2026-04-25",
          dateTo: "2026-05-01",
          subDetails: [],
        },
      ])
    ).toBe("작업 (04.25~05.01)");
  });

  it("renders subDetails with - prefix on next lines", () => {
    expect(
      contentLinesToText([
        {
          id: "1",
          text: "메인",
          dateFrom: "",
          dateTo: "",
          subDetails: [
            { id: "s1", text: "세부1", dateFrom: "", dateTo: "" },
            {
              id: "s2",
              text: "세부2",
              dateFrom: "2026-04-25",
              dateTo: "2026-04-26",
            },
          ],
        },
      ])
    ).toBe("메인\n- 세부1\n- 세부2 (04.25~04.26)");
  });

  it("skips empty lines", () => {
    expect(
      contentLinesToText([
        { id: "1", text: "", dateFrom: "", dateTo: "", subDetails: [] },
        { id: "2", text: "있음", dateFrom: "", dateTo: "", subDetails: [] },
      ])
    ).toBe("있음");
  });
});

describe("generateFileName", () => {
  const baseData: ReportData = {
    mode: "employee",
    meetingDate: "2026-04-25",
    teamName: "개발2팀",
    authorName: "전병일",
    thisWeekTasks: [],
    nextWeekTasks: [],
    members: [],
    targetBusiness: "",
    requestTeam: "",
    devPeriodFrom: "",
    devPeriodTo: "",
    nextTargetBusiness: "",
    nextRequestTeam: "",
    nextDevPeriodFrom: "",
    nextDevPeriodTo: "",
    issues: "",
    etc: "",
    nextIssues: "",
    nextEtc: "",
  };

  it("formats {date}_주간업무_{team}_{author}.{ext}", () => {
    expect(generateFileName(baseData, "docx")).toBe("20260425_주간업무_개발2팀_전병일.docx");
  });

  it("falls back to placeholders when team/author empty", () => {
    expect(generateFileName({ ...baseData, teamName: "", authorName: "" }, "pdf")).toBe(
      "20260425_주간업무_팀_이름.pdf"
    );
  });
});

describe("createEmpty* factories", () => {
  it("createEmptyTask returns a task with one content line", () => {
    const task = createEmptyTask();
    expect(task.id).toBeTruthy();
    expect(task.title).toBe("");
    expect(task.contentLines).toHaveLength(1);
    expect(task.contentLines[0].id).not.toBe(task.id);
  });

  it("createEmptyContentLine has empty subDetails", () => {
    const line = createEmptyContentLine();
    expect(line.subDetails).toEqual([]);
  });

  it("createEmptySubDetail has all empty strings", () => {
    const sub = createEmptySubDetail();
    expect(sub.text).toBe("");
    expect(sub.dateFrom).toBe("");
    expect(sub.dateTo).toBe("");
  });

  it("createEmptyMember has both week task arrays initialized", () => {
    const m = createEmptyMember();
    expect(m.thisWeekTasks).toHaveLength(1);
    expect(m.nextWeekTasks).toHaveLength(1);
  });
});
