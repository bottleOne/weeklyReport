"use client";

import type { ProjectPlanData } from "@/lib/plan-types";
import { TASK_STATUS_LABEL } from "@/lib/plan-types";
import { formatDateRange } from "@/lib/types";

interface PlanPreviewProps {
  data: ProjectPlanData;
}

function paragraph(text: string) {
  if (!text.trim()) return <span className="text-gray-400">(미입력)</span>;
  return text.split("\n").map((line, i) => (
    <p key={i} className="leading-relaxed">
      {line || " "}
    </p>
  ));
}

export default function PlanPreview({ data }: PlanPreviewProps) {
  const totalRange =
    data.startDate || data.endDate ? `${data.startDate || ""} ~ ${data.endDate || ""}` : "(미정)";

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
        {data.milestones.length === 0 ? (
          <span className="text-gray-400">(마일스톤 없음)</span>
        ) : (
          <div className="space-y-4">
            {data.milestones.map((m, mi) => (
              <div key={m.id}>
                <div className="mb-1 font-semibold">
                  {mi + 1}) {m.title || "(마일스톤 미입력)"}
                  {(m.dateFrom || m.dateTo) && (
                    <span className="ml-2 text-xs text-gray-500">
                      [{formatDateRange({ dateFrom: m.dateFrom, dateTo: m.dateTo }) || "기간 미정"}]
                    </span>
                  )}
                </div>
                {m.description && (
                  <div className="mb-1 ml-4 text-xs text-gray-600">{m.description}</div>
                )}
                <table className="ml-4 w-[calc(100%-1rem)] table-auto border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-300 text-left text-gray-500">
                      <th className="py-1 pr-2">작업</th>
                      <th className="w-20 py-1 pr-2">담당</th>
                      <th className="w-32 py-1 pr-2">기간</th>
                      <th className="w-16 py-1">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.tasks.map((t) => (
                      <tr key={t.id} className="border-b border-gray-100 align-top">
                        <td className="py-1 pr-2">
                          <div>{t.title || "-"}</div>
                          {t.notes && <div className="text-[11px] text-gray-500">{t.notes}</div>}
                        </td>
                        <td className="py-1 pr-2">{t.assignee || "-"}</td>
                        <td className="py-1 pr-2">
                          {formatDateRange({ dateFrom: t.dateFrom, dateTo: t.dateTo }) || "-"}
                        </td>
                        <td className="py-1">{TASK_STATUS_LABEL[t.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
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
