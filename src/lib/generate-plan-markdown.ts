import type { ProjectPlanData } from "./plan-types";
import { TASK_STATUS_LABEL } from "./plan-types";
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
  if (data.milestones.length === 0) {
    lines.push("(마일스톤 없음)");
    lines.push("");
  } else {
    data.milestones.forEach((m, mi) => {
      const range = formatDateRange({ dateFrom: m.dateFrom, dateTo: m.dateTo });
      const titleLine = `### ${mi + 1}) ${m.title || "(마일스톤 미입력)"}${range ? ` — ${range}` : ""}`;
      lines.push(titleLine);
      if (m.description) {
        lines.push(`_${m.description}_`);
      }
      if (m.tasks.length > 0) {
        lines.push("");
        lines.push("| 작업 | 담당 | 기간 | 상태 | 메모 |");
        lines.push("|---|---|---|---|---|");
        m.tasks.forEach((t) => {
          const taskRange = formatDateRange({ dateFrom: t.dateFrom, dateTo: t.dateTo }) || "-";
          const status = TASK_STATUS_LABEL[t.status];
          const escapedNotes = (t.notes || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
          lines.push(
            `| ${t.title || "-"} | ${t.assignee || "-"} | ${taskRange} | ${status} | ${escapedNotes || "-"} |`
          );
        });
      }
      lines.push("");
    });
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
