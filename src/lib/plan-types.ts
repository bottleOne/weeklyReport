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

/** Risk 영향도 / 발생 확률 등급. low=1 / medium=2 / high=3 으로 점수화. */
export type RiskLevel = "low" | "medium" | "high";

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  low: "낮음",
  medium: "중간",
  high: "높음",
};

export const RISK_LEVEL_SCORE: Record<RiskLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/**
 * 리스크 — 자유서술 대신 구조화. impact × likelihood 로 위험도 점수(1~9) 계산.
 */
export interface RiskItem {
  id: string;
  description: string;
  impact: RiskLevel;
  likelihood: RiskLevel;
  mitigation: string;
}

/** 문서 상태 — Draft → Review → Approved → Archived 흐름. */
export type PlanStatus = "draft" | "review" | "approved" | "archived";

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  draft: "초안",
  review: "검토 중",
  approved: "승인됨",
  archived: "보관",
};

/**
 * 변경 이력 항목 — 상태 전환 또는 수동 메모.
 * date: ISO 문자열, author: 작성자(자동: ProjectPlanData.authorName), summary: 한 줄 요약.
 */
export interface ChangeLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  author: string;
  summary: string;
}

/** 이해관계자 책임 (RACI lite). */
export type Responsibility = "owner" | "contributor" | "reviewer" | "informed";

export const RESPONSIBILITY_LABEL: Record<Responsibility, string> = {
  owner: "오너",
  contributor: "기여자",
  reviewer: "리뷰어",
  informed: "참고",
};

/**
 * 이해관계자 — 자유서술 대신 구조화. 일정 entry assignee와 자동완성 연동.
 */
export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  responsibility: Responsibility;
}

export interface ProjectPlanData {
  // 기본 정보
  title: string;
  authorName: string;
  teamName: string;
  createdDate: string;

  // 문서 상태 + 변경 이력 (Phase 5)
  status: PlanStatus;
  changeLog: ChangeLogEntry[];

  // 이해관계자 (Phase 4에서 자유서술 → 구조화, 본문 4번에서 분리)
  stakeholders: Stakeholder[];

  // 기획 본문
  background: string;
  objective: string;
  scope: string;
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

  // 리스크 (Phase 3에서 자유서술 → 구조화) + 기타
  risks: RiskItem[];
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
    status: "draft",
    changeLog: [],
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

export function createEmptyRisk(): RiskItem {
  return {
    id: newId(),
    description: "",
    impact: "medium",
    likelihood: "medium",
    mitigation: "",
  };
}

/** 위험도 점수 = impact × likelihood (1~9). 정렬·시각 강조 기준. */
export function computeRiskScore(item: RiskItem): number {
  return RISK_LEVEL_SCORE[item.impact] * RISK_LEVEL_SCORE[item.likelihood];
}

/** 위험도 점수 내림차순 정렬 (원본 불변). 동점은 입력 순서 유지(stable). */
export function sortRisksByScore(items: RiskItem[]): RiskItem[] {
  return [...items].sort((a, b) => computeRiskScore(b) - computeRiskScore(a));
}

/**
 * Phase 3 마이그레이션 — v2 legacy `risks: string`을 `RiskItem[]`로 변환.
 * 한 줄에 한 risk로 split, 빈 줄 제외. impact/likelihood는 medium 기본값.
 * 사용자는 페이지 로드 후 카드별로 영향도/확률만 보강.
 */
export function legacyRisksTextToItems(text: string): RiskItem[] {
  if (!text || !text.trim()) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((description) => ({
      id: newId(),
      description,
      impact: "medium" as const,
      likelihood: "medium" as const,
      mitigation: "",
    }));
}

export function createEmptyStakeholder(): Stakeholder {
  return {
    id: newId(),
    name: "",
    role: "",
    responsibility: "contributor",
  };
}

/** 변경 이력 항목 생성 — 오늘 날짜, 호출자가 author/summary 채움. */
export function createChangeLogEntry(author: string, summary: string): ChangeLogEntry {
  return {
    id: newId(),
    date: getTodayLocal(),
    author,
    summary,
  };
}

/** 변경 이력 정렬 — 최신 항목이 위로 (date 내림차순, stable). */
export function sortChangeLogDesc(items: ChangeLogEntry[]): ChangeLogEntry[] {
  return [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/**
 * Phase 4 마이그레이션 — v2 legacy `stakeholders: string`을 `Stakeholder[]`로 변환.
 * 한 줄에 한 사람으로 split, 빈 줄 제외. 줄을 통째로 name에 넣고
 * role 빈 값, responsibility는 contributor 기본.
 */
export function legacyStakeholdersTextToItems(text: string): Stakeholder[] {
  if (!text || !text.trim()) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((name) => ({
      id: newId(),
      name,
      role: "",
      responsibility: "contributor" as const,
    }));
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
