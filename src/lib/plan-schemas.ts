import { z } from "zod";
import { legacyRisksTextToItems, legacyStakeholdersTextToItems } from "./plan-types";

/**
 * 프로젝트 기획서 도메인 zod 스키마.
 * plan-types.ts의 인터페이스와 일치해야 함.
 */

export const TaskStatusSchema = z.enum(["todo", "in_progress", "done", "blocked"]);
export const RiskLevelSchema = z.enum(["low", "medium", "high"]);
export const ResponsibilitySchema = z.enum(["owner", "contributor", "reviewer", "informed"]);

export const PlanScheduleEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  details: z.string(),
  assignee: z.string(),
  status: TaskStatusSchema,
});

export const OpenQuestionItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  resolved: z.boolean(),
  resolution: z.string(),
});

export const SuccessMetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  target: z.string(),
  method: z.string(),
  timeline: z.string(),
});

export const RiskItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  impact: RiskLevelSchema,
  likelihood: RiskLevelSchema,
  mitigation: z.string(),
});

export const StakeholderSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  responsibility: ResponsibilitySchema,
});

/**
 * Phase 3 마이그레이션 — v2 legacy `risks: string`을 `RiskItem[]`로 자동 변환.
 * preprocess 단계에서 string이면 한 줄당 한 risk로 split (medium/medium 기본),
 * 이미 array이면 그대로. localStorage 키 변경 없이 무중단 호환.
 */
const RisksField = z.preprocess((val) => {
  if (typeof val === "string") return legacyRisksTextToItems(val);
  return val;
}, z.array(RiskItemSchema).default([]));

/**
 * Phase 4 마이그레이션 — v2/v3 legacy `stakeholders: string`을 `Stakeholder[]`로 자동 변환.
 * 한 줄당 한 사람, role 빈 값, responsibility는 contributor 기본.
 */
const StakeholdersField = z.preprocess((val) => {
  if (typeof val === "string") return legacyStakeholdersTextToItems(val);
  return val;
}, z.array(StakeholderSchema).default([]));

// Phase 1: nonGoals + openQuestions 도입.
// Phase 2: northStar + successMetrics 도입.
// v2 localStorage 호환을 위해 신규 필드는 default 값 부여 → 기존 사용자는 빈 값으로 부드럽게 마이그레이션.
export const ProjectPlanDataSchema = z.object({
  title: z.string(),
  authorName: z.string(),
  teamName: z.string(),
  createdDate: z.string(),
  stakeholders: StakeholdersField,
  background: z.string(),
  objective: z.string(),
  scope: z.string(),
  deliverables: z.string(),
  nonGoals: z.string().default(""),
  openQuestions: z.array(OpenQuestionItemSchema).default([]),
  northStar: z.string().default(""),
  successMetrics: z.array(SuccessMetricSchema).default([]),
  startDate: z.string(),
  endDate: z.string(),
  scheduleEntries: z.array(PlanScheduleEntrySchema),
  risks: RisksField,
  etc: z.string(),
});
