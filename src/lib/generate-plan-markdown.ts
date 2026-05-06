import type { ProjectPlanData } from "./plan-types";
import { TASK_STATUS_LABEL, sortOpenQuestions, sortScheduleEntriesByStart } from "./plan-types";
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

  // North Star + 성공 지표 — 본문 번호 외 헤더 영역
  if (data.northStar.trim()) {
    lines.push("## 🌟 North Star");
    lines.push("");
    lines.push(`> ${data.northStar.trim()}`);
    lines.push("");
  }

  lines.push("## 성공 지표");
  lines.push("");
  if (data.successMetrics.length === 0) {
    lines.push("(등록된 지표 없음)");
    lines.push("");
  } else {
    lines.push("| 지표 | 목표값 | 측정방법 | 시점 |");
    lines.push("|---|---|---|---|");
    for (const m of data.successMetrics) {
      const safe = (s: string) => s.replace(/\|/g, "\\|").trim() || "-";
      lines.push(
        `| ${safe(m.name)} | ${safe(m.target)} | ${safe(m.method)} | ${safe(m.timeline)} |`
      );
    }
    lines.push("");
  }

  pushSection(lines, "1. 배경 / 필요성", data.background);
  pushSection(lines, "2. 목표", data.objective);
  pushSection(lines, "3. 범위", data.scope);
  pushSection(lines, "4. 이해관계자", data.stakeholders);
  pushSection(lines, "5. 산출물", data.deliverables);
  pushSection(lines, "6. 범위 외 (Non-goals)", data.nonGoals);
  pushOpenQuestions(lines, data);

  const totalRange =
    data.startDate || data.endDate ? ` (${data.startDate || ""} ~ ${data.endDate || ""})` : "";
  lines.push(`## 8. 일정${totalRange}`);
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

  pushSection(lines, "9. 리스크", data.risks);
  pushSection(lines, "10. 기타", data.etc);

  return lines.join("\n");
}

function pushSection(lines: string[], heading: string, body: string): void {
  lines.push(`## ${heading}`);
  lines.push("");
  lines.push(body.trim() ? body : "(미입력)");
  lines.push("");
}

function pushOpenQuestions(lines: string[], data: ProjectPlanData): void {
  lines.push("## 7. 미결사항");
  lines.push("");
  if (data.openQuestions.length === 0) {
    lines.push("(미입력)");
    lines.push("");
    return;
  }
  for (const q of sortOpenQuestions(data.openQuestions)) {
    const checkbox = q.resolved ? "[x]" : "[ ]";
    const text = q.question.trim() || "(빈 질문)";
    lines.push(`- ${checkbox} ${text}`);
    if (q.resolved && q.resolution.trim()) {
      // 답변은 들여쓰기로 부속 표기
      const indented = q.resolution.trim().split("\n").join("\n  ");
      lines.push(`  - **답변**: ${indented}`);
    }
  }
  lines.push("");
}
