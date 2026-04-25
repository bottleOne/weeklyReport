"use client";

import type { ReportData, TaskItem } from "@/lib/types";
import { getDayOfWeek, formatDateRange } from "@/lib/types";

interface PreviewTableProps {
  data: ReportData;
}

function renderTasks(tasks: TaskItem[]): string {
  return tasks
    .map((task, idx) => {
      const lines: string[] = [];
      lines.push(`${idx + 1}. ${task.title || "(업무명 미입력)"}`);

      const contentLines = task.contentLines || [];
      const hasContent = contentLines.some(
        (l) => l.text.trim() || (l.subDetails || []).some((s) => s.text.trim())
      );

      if (hasContent) {
        lines.push("내용 :");
        let cNum = 0;
        contentLines.forEach((line) => {
          if (line.text.trim()) {
            cNum++;
            const dateStr = formatDateRange(line);
            const mainText = dateStr ? `${line.text} (${dateStr})` : line.text;
            lines.push(`  ${cNum}) ${mainText}`);
          }
          (line.subDetails || []).forEach((sub) => {
            if (sub.text.trim()) {
              const sDate = formatDateRange(sub);
              const subText = sDate ? `- ${sub.text} (${sDate})` : `- ${sub.text}`;
              lines.push(`    ${subText}`);
            }
          });
        });
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

function renderMetaFrom(
  targetBusiness: string,
  requestTeam: string,
  devPeriodFrom: string,
  devPeriodTo: string
): string {
  const lines: string[] = [];
  if (targetBusiness) lines.push(`대상업무 : ${targetBusiness}`);
  if (requestTeam) lines.push(` 의뢰팀 : ${requestTeam}`);
  if (devPeriodFrom || devPeriodTo)
    lines.push(` 개발기간 : ${devPeriodFrom || ""}~${devPeriodTo || ""}`);
  return lines.length > 0 ? "\n\n" + lines.join("\n") : "";
}

function renderMeta(data: ReportData): string {
  return renderMetaFrom(
    data.targetBusiness,
    data.requestTeam,
    data.devPeriodFrom,
    data.devPeriodTo
  );
}

function renderNextMeta(data: ReportData): string {
  return renderMetaFrom(
    data.nextTargetBusiness,
    data.nextRequestTeam,
    data.nextDevPeriodFrom,
    data.nextDevPeriodTo
  );
}

export default function PreviewTable({ data }: PreviewTableProps) {
  const thClass =
    "border border-gray-800 px-2 py-1.5 font-bold text-center bg-gray-100 align-middle text-xs";
  const tdClass =
    "border border-gray-800 px-2 py-1.5 align-top whitespace-pre-wrap leading-relaxed text-xs";

  const isLeader = data.mode === "leader";

  return (
    <div id="preview-content" className="rounded border border-gray-300 bg-white p-10 shadow-sm">
      <h1 className="mb-5 text-xl font-bold underline">주간업무</h1>

      <table className="w-full border-collapse text-xs">
        <tbody>
          {/* Row 1: 기본정보 */}
          <tr>
            <td className={thClass} style={{ width: "100px" }}>
              회의기준일
            </td>
            <td className={`${tdClass} text-center`} style={{ width: "320px" }}>
              {data.meetingDate ? `${data.meetingDate} (${getDayOfWeek(data.meetingDate)})` : "-"}
            </td>
            <td className={thClass} style={{ width: "80px" }}>
              팀명/이름
            </td>
            <td className={`${tdClass} text-center`}>
              {data.teamName || data.authorName ? `${data.teamName} / ${data.authorName}` : "-"}
            </td>
          </tr>

          {/* Row 2: 구분 헤더 */}
          <tr>
            <td className={thClass}>구분</td>
            <td className={thClass}>금주</td>
            <td colSpan={2} className={thClass}>
              차주
            </td>
          </tr>

          {/* 사원 모드: 업무 행 1개 */}
          {!isLeader && (
            <tr>
              <td className={`${thClass} text-[11px]`}>업무</td>
              <td className={tdClass} style={{ minHeight: "300px" }}>
                {renderTasks(data.thisWeekTasks)}
                {renderMeta(data)}
              </td>
              <td colSpan={2} className={tdClass} style={{ minHeight: "300px" }}>
                {renderTasks(data.nextWeekTasks)}
                {renderNextMeta(data)}
              </td>
            </tr>
          )}

          {/* 팀장 모드: 팀원별 행 */}
          {isLeader &&
            data.members.map((member) => (
              <tr key={member.id}>
                <td className={`${thClass} text-[11px]`}>{member.name || "(이름)"}</td>
                <td className={tdClass}>{renderTasks(member.thisWeekTasks)}</td>
                <td colSpan={2} className={tdClass}>
                  {renderTasks(member.nextWeekTasks)}
                </td>
              </tr>
            ))}

          {/* 팀장 모드: 메타 행 */}
          {isLeader && renderMeta(data) && (
            <tr>
              <td className={thClass}></td>
              <td colSpan={3} className={`${tdClass} whitespace-pre-wrap`}>
                {renderMeta(data).trim()}
              </td>
            </tr>
          )}

          {/* 주요이슈 */}
          <tr>
            <td className={thClass} style={{ height: "50px" }}>
              주요이슈
            </td>
            <td className={`${tdClass} min-h-[40px]`}>{data.issues || ""}</td>
            <td colSpan={2} className={`${tdClass} min-h-[40px]`}></td>
          </tr>

          {/* 기타 */}
          <tr>
            <td className={thClass} style={{ height: "55px" }}>
              기타
            </td>
            <td className={`${tdClass} min-h-[40px]`}>{data.etc || ""}</td>
            <td colSpan={2} className={`${tdClass} min-h-[40px]`}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
