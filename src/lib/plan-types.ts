import { newId, getTodayLocal } from "./types";

/**
 * 일정 항목 — 캘린더 range로 만든 한 단위.
 * 제목 / 기간 / 상세 / 담당 / 상태.
 */
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "예정",
  in_progress: "진행중",
  done: "완료",
  blocked: "지연",
};

export interface PlanScheduleEntry {
  id: string;
  title: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
  details: string;
  assignee: string;
  status: TaskStatus;
}

export interface ProjectPlanData {
  // 기본 정보
  title: string;
  authorName: string;
  teamName: string;
  createdDate: string;

  // 기획 본문
  background: string;
  objective: string;
  scope: string;
  stakeholders: string;
  deliverables: string;

  // 일정 (캘린더 + 항목 리스트)
  startDate: string;
  endDate: string;
  scheduleEntries: PlanScheduleEntry[];

  // 기타
  risks: string;
  etc: string;
}

export function createEmptyScheduleEntry(): PlanScheduleEntry {
  return {
    id: newId(),
    title: "",
    dateFrom: "",
    dateTo: "",
    details: "",
    assignee: "",
    status: "todo",
  };
}

export function createScheduleEntryFromRange(dateFrom: string, dateTo: string): PlanScheduleEntry {
  return {
    id: newId(),
    title: "",
    dateFrom,
    dateTo: dateTo || dateFrom,
    details: "",
    assignee: "",
    status: "todo",
  };
}

export function createEmptyPlan(): ProjectPlanData {
  return {
    title: "",
    authorName: "",
    teamName: "",
    createdDate: getTodayLocal(),
    background: "",
    objective: "",
    scope: "",
    stakeholders: "",
    deliverables: "",
    startDate: "",
    endDate: "",
    scheduleEntries: [],
    risks: "",
    etc: "",
  };
}

export function generatePlanFileName(data: ProjectPlanData, ext: string): string {
  const date = data.createdDate.replace(/-/g, "");
  const team = data.teamName || "팀";
  const title = data.title || "기획서";
  return `${date}_프로젝트기획서_${team}_${title}.${ext}`;
}

/** 항목들을 시작일 기준 오름차순 정렬한 사본 반환 (원본 불변). */
export function sortScheduleEntriesByStart(entries: PlanScheduleEntry[]): PlanScheduleEntry[] {
  return [...entries].sort((a, b) => {
    if (!a.dateFrom && !b.dateFrom) return 0;
    if (!a.dateFrom) return 1;
    if (!b.dateFrom) return -1;
    return a.dateFrom.localeCompare(b.dateFrom);
  });
}
