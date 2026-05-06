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

/**
 * 미결사항 — 기획 단계에서 답이 없는 질문을 명시.
 * resolved=true면 resolution 답변 노출.
 */
export interface OpenQuestionItem {
  id: string;
  question: string;
  resolved: boolean;
  resolution: string;
}

/**
 * 성공 지표 — 측정 가능한 목표 + 측정방법 + 시점.
 * northStar(상위 한 줄 비전)와 함께 평가 기준 역할.
 */
export interface SuccessMetric {
  id: string;
  name: string;
  target: string;
  method: string;
  timeline: string;
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

  // 범위 외 + 미결사항 (Phase 1)
  nonGoals: string;
  openQuestions: OpenQuestionItem[];

  // 성공 지표 (Phase 2)
  northStar: string;
  successMetrics: SuccessMetric[];

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
}

export function createEmptyOpenQuestion(): OpenQuestionItem {
  return {
    id: newId(),
    question: "",
    resolved: false,
    resolution: "",
  };
}

export function createEmptySuccessMetric(): SuccessMetric {
  return {
    id: newId(),
    name: "",
    target: "",
    method: "",
    timeline: "",
  };
}

/**
 * 미결사항 정렬 — 미해결을 위로, 해결된 것을 아래로 (안정 정렬).
 * 원본 불변, 새 배열 반환.
 */
export function sortOpenQuestions(items: OpenQuestionItem[]): OpenQuestionItem[] {
  return [...items].sort((a, b) => Number(a.resolved) - Number(b.resolved));
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
