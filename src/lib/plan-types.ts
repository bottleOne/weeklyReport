import { newId, getTodayLocal } from "./types";

export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "예정",
  in_progress: "진행중",
  done: "완료",
  blocked: "지연",
};

export interface PlanTask {
  id: string;
  title: string;
  assignee: string;
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
  status: TaskStatus;
  notes: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dateFrom: string;
  dateTo: string;
  tasks: PlanTask[];
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

  // 일정
  startDate: string;
  endDate: string;
  milestones: Milestone[];

  // 기타
  risks: string;
  etc: string;
}

export function createEmptyPlanTask(): PlanTask {
  return {
    id: newId(),
    title: "",
    assignee: "",
    dateFrom: "",
    dateTo: "",
    status: "todo",
    notes: "",
  };
}

export function createEmptyMilestone(): Milestone {
  return {
    id: newId(),
    title: "",
    description: "",
    dateFrom: "",
    dateTo: "",
    tasks: [createEmptyPlanTask()],
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
    milestones: [createEmptyMilestone()],
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
