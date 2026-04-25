export interface SubDetail {
  id: string;
  text: string;
  dateFrom: string; // 시작일 YYYY-MM-DD (선택)
  dateTo: string; // 종료일 YYYY-MM-DD (선택)
}

export interface ContentLine {
  id: string;
  text: string;
  dateFrom: string; // 시작일 YYYY-MM-DD (선택)
  dateTo: string; // 종료일 YYYY-MM-DD (선택)
  subDetails: SubDetail[];
}

export interface TaskItem {
  id: string;
  title: string;
  contentLines: ContentLine[];
}

export type ReportMode = "employee" | "leader";

export interface MemberData {
  id: string;
  name: string;
  thisWeekTasks: TaskItem[];
  nextWeekTasks: TaskItem[];
}

export interface ReportData {
  mode: ReportMode;
  meetingDate: string;
  teamName: string;
  authorName: string;
  // 사원 모드
  thisWeekTasks: TaskItem[];
  nextWeekTasks: TaskItem[];
  // 팀장 모드
  members: MemberData[];
  // 금주 메타
  targetBusiness: string;
  requestTeam: string;
  devPeriodFrom: string;
  devPeriodTo: string;
  // 차주 메타
  nextTargetBusiness: string;
  nextRequestTeam: string;
  nextDevPeriodFrom: string;
  nextDevPeriodTo: string;
  // 공통
  issues: string;
  etc: string;
}

/** UUID 기반 ID 생성. 환경에 randomUUID가 없으면 fallback. */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback (구형 환경): timestamp + random
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 로컬 타임존 기준 오늘 날짜를 YYYY-MM-DD로 반환 */
export function getTodayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function createEmptySubDetail(): SubDetail {
  return {
    id: newId(),
    text: "",
    dateFrom: "",
    dateTo: "",
  };
}

export function createEmptyContentLine(): ContentLine {
  return {
    id: newId(),
    text: "",
    dateFrom: "",
    dateTo: "",
    subDetails: [],
  };
}

export function createEmptyTask(): TaskItem {
  return {
    id: newId(),
    title: "",
    contentLines: [createEmptyContentLine()],
  };
}

export function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return "";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(dateStr);
  return days[d.getDay()];
}

export function createEmptyMember(): MemberData {
  return {
    id: newId(),
    name: "",
    thisWeekTasks: [createEmptyTask()],
    nextWeekTasks: [createEmptyTask()],
  };
}

export function generateFileName(data: ReportData, ext: string): string {
  const date = data.meetingDate.replace(/-/g, "");
  const team = data.teamName || "팀";
  const name = data.authorName || "이름";
  return `${date}_주간업무_${team}_${name}.${ext}`;
}

/** YYYY-MM-DD → MM.DD */
function toShortDate(d: string): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[1]}.${parts[2]}`;
  return d;
}

/** SubDetail 또는 ContentLine의 날짜를 표시용 문자열로 변환 */
export function formatDateRange(line: { dateFrom: string; dateTo: string }): string {
  const from = toShortDate(line.dateFrom);
  const to = toShortDate(line.dateTo);
  if (from && to) return `${from}~${to}`;
  if (from) return `${from}~`;
  if (to) return `~${to}`;
  return "";
}

/** contentLines → 단일 문자열 (docx/preview용) */
export function contentLinesToText(lines: ContentLine[]): string {
  return lines
    .map((l) => {
      const dateStr = formatDateRange(l);
      let mainText = l.text;
      if (dateStr && mainText) mainText = `${mainText} (${dateStr})`;

      const subTexts = (l.subDetails || [])
        .map((s) => {
          const sDate = formatDateRange(s);
          if (sDate && s.text) return `- ${s.text} (${sDate})`;
          return s.text ? `- ${s.text}` : "";
        })
        .filter((t) => t.trim());

      return [mainText, ...subTexts].filter((t) => t.trim()).join("\n");
    })
    .filter((t) => t.trim())
    .join("\n");
}
