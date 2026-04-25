"use client";

import type { ProjectPlanData } from "@/lib/plan-types";
import { TASK_STATUS_LABEL, sortScheduleEntriesByStart } from "@/lib/plan-types";
import { formatDateRange } from "@/lib/types";

interface PlanPreviewProps {
  data: ProjectPlanData;
}

function paragraph(text: string) {
  if (!text.trim()) return <span className="text-gray-400">(미입력)</span>;
  return text.split("\n").map((line, i) => (
    <p key={i} className="leading-relaxed">
      {line || " "}
    </p>
  ));
}

export default function PlanPreview({ data }: PlanPreviewProps) {
  const totalRange =
    data.startDate || data.endDate ? `${data.startDate || ""} ~ ${data.endDate || ""}` : "(미정)";
  const sorted = sortScheduleEntriesByStart(data.scheduleEntries);

  return (
    <div
      id="plan-preview-content"
      className="mx-auto w-full max-w-[900px] rounded-xl border border-gray-200 bg-white p-10 text-sm text-gray-800"
    >
      <h1 className="mb-2 text-center text-2xl font-extrabold">{data.title || "(제목 미입력)"}</h1>
      <p className="mb-8 text-center text-xs text-gray-500">
        프로젝트 기획서 · {data.teamName || "팀"} · 작성자 {data.authorName || "이름"} · 작성일{" "}
        {data.createdDate}
      </p>

      <Section title="1. 배경 / 필요성">{paragraph(data.background)}</Section>
      <Section title="2. 목표">{paragraph(data.objective)}</Section>
      <Section title="3. 범위">{paragraph(data.scope)}</Section>
      <Section title="4. 이해관계자">{paragraph(data.stakeholders)}</Section>
      <Section title="5. 산출물">{paragraph(data.deliverables)}</Section>

      <Section title={`6. 일정 (${totalRange})`}>
        {sorted.length === 0 ? (
          <span className="text-gray-400">(등록된 일정 없음)</span>
        ) : (
          <table className="w-full table-fixed border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-gray-300 text-left">
                <th className="w-10 py-2 pr-2 text-gray-500">#</th>
                <th className="w-40 py-2 pr-2 text-gray-500">기간</th>
                <th className="w-1/4 py-2 pr-2 text-gray-500">제목</th>
                <th className="w-20 py-2 pr-2 text-gray-500">담당</th>
                <th className="w-16 py-2 pr-2 text-gray-500">상태</th>
                <th className="py-2 text-gray-500">상세</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e, idx) => (
                <tr key={e.id} className="border-b border-gray-100 align-top">
                  <td className="py-2 pr-2 font-medium">{idx + 1}</td>
                  <td className="py-2 pr-2">
                    {formatDateRange({ dateFrom: e.dateFrom, dateTo: e.dateTo }) || "-"}
                  </td>
                  <td className="py-2 pr-2 font-semibold">{e.title || "-"}</td>
                  <td className="py-2 pr-2">{e.assignee || "-"}</td>
                  <td className="py-2 pr-2">{TASK_STATUS_LABEL[e.status]}</td>
                  <td className="py-2 leading-relaxed whitespace-pre-wrap">{e.details || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="7. 리스크">{paragraph(data.risks)}</Section>
      <Section title="8. 기타">{paragraph(data.etc)}</Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 border-b border-gray-200 pb-1 text-base font-bold">{title}</h2>
      <div className="pl-2">{children}</div>
    </div>
  );
}
