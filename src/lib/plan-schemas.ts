import { z } from "zod";

/**
 * 프로젝트 기획서 도메인 zod 스키마.
 * plan-types.ts의 인터페이스와 일치해야 함.
 */

export const TaskStatusSchema = z.enum(["todo", "in_progress", "done", "blocked"]);

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

// 새 필드(nonGoals, openQuestions)는 Phase 1 도입.
// v2 localStorage 호환을 위해 default 값을 부여 → 기존 사용자는 빈 값으로 부드럽게 마이그레이션.
export const ProjectPlanDataSchema = z.object({
  title: z.string(),
  authorName: z.string(),
  teamName: z.string(),
  createdDate: z.string(),
  background: z.string(),
  objective: z.string(),
  scope: z.string(),
  stakeholders: z.string(),
  deliverables: z.string(),
  nonGoals: z.string().default(""),
  openQuestions: z.array(OpenQuestionItemSchema).default([]),
  startDate: z.string(),
  endDate: z.string(),
  scheduleEntries: z.array(PlanScheduleEntrySchema),
  risks: z.string(),
  etc: z.string(),
});
