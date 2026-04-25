import type { ProjectPlanData } from "./plan-types";
import { TASK_STATUS_LABEL, sortScheduleEntriesByStart } from "./plan-types";
import { formatDateRange } from "./types";

/** ProjectPlanData를 Markdown 문자열로 직렬화. 클라이언트에서 직접 호출. */
export function generatePlanMarkdown(data: ProjectPlanData): string {
  const lines: string[] = [];

  lines.push(`# ${data.title || "프로젝트 기획서"}`);
  lines.push("");
  lines.push(
    `> ${data.teamName || "팀"} · 작성자 ${data.authorName || "이름"} · 작성일 ${data.createdDate}`
  );
  lines.push("");

  pushSection(lines, "1. 배경 / 필요성", data.background);
  pushSection(lines, "2. 목표", data.objective);
  pushSection(lines, "3. 범위", data.scope);
  pushSection(lines, "4. 이해관계자", data.stakeholders);
  pushSection(lines, "5. 산출물", data.deliverables);

  const totalRange =
    data.startDate || data.endDate ? ` (${data.startDate || ""} ~ ${data.endDate || ""})` : "";
  lines.push(`## 6. 일정${totalRange}`);
  lines.push("");

  const sorted = sortScheduleEntriesByStart(data.scheduleEntries);
  if (sorted.length === 0) {
    lines.push("(등록된 일정이 없습니다)");
    lines.push("");
  } else {
    lines.push("| # | 기간 | 제목 | 담당 | 상태 | 상세 |");
    lines.push("|---|---|---|---|---|---|");
    sorted.forEach((e, idx) => {
      const range = formatDateRange({ dateFrom: e.dateFrom, dateTo: e.dateTo }) || "-";
      const status = TASK_STATUS_LABEL[e.status];
      const safeDetails = (e.details || "-").replace(/\|/g, "\\|").replace(/\n/g, "<br/>");
      lines.push(
        `| ${idx + 1} | ${range} | ${e.title || "-"} | ${e.assignee || "-"} | ${status} | ${safeDetails} |`
      );
    });
    lines.push("");
  }

  pushSection(lines, "7. 리스크", data.risks);
  pushSection(lines, "8. 기타", data.etc);

  return lines.join("\n");
}

function pushSection(lines: string[], heading: string, body: string): void {
  lines.push(`## ${heading}`);
  lines.push("");
  lines.push(body.trim() ? body : "(미입력)");
  lines.push("");
}
