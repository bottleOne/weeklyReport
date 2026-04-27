import { z } from "zod";

/**
 * 도메인 스키마 — API 경계에서 입력 검증에 사용.
 * types.ts의 인터페이스와 일치해야 함 (타입을 inference로 export).
 */

export const SubDetailSchema = z.object({
  id: z.string(),
  text: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
});

export const ContentLineSchema = z.object({
  id: z.string(),
  text: z.string(),
  dateFrom: z.string(),
  dateTo: z.string(),
  subDetails: z.array(SubDetailSchema),
});

export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  contentLines: z.array(ContentLineSchema),
});

export const ReportModeSchema = z.enum(["employee", "leader"]);

export const MemberDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  thisWeekTasks: z.array(TaskItemSchema),
  nextWeekTasks: z.array(TaskItemSchema),
});

export const ReportDataSchema = z.object({
  mode: ReportModeSchema,
  meetingDate: z.string(),
  teamName: z.string(),
  authorName: z.string(),
  thisWeekTasks: z.array(TaskItemSchema),
  nextWeekTasks: z.array(TaskItemSchema),
  members: z.array(MemberDataSchema),
  targetBusiness: z.string(),
  requestTeam: z.string(),
  devPeriodFrom: z.string(),
  devPeriodTo: z.string(),
  nextTargetBusiness: z.string(),
  nextRequestTeam: z.string(),
  nextDevPeriodFrom: z.string(),
  nextDevPeriodTo: z.string(),
  issues: z.string(),
  etc: z.string(),
  nextIssues: z.string(),
  nextEtc: z.string(),
});
