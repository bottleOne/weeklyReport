"use client";

import type {
  ProjectPlanData,
  OpenQuestionItem,
  SuccessMetric,
  RiskItem,
  Stakeholder,
  ChangeLogEntry,
} from "@/lib/plan-types";
import {
  TASK_STATUS_LABEL,
  RISK_LEVEL_LABEL,
  RESPONSIBILITY_LABEL,
  PLAN_STATUS_LABEL,
  computeRiskScore,
  sortChangeLogDesc,
  sortOpenQuestions,
  sortRisksByScore,
  sortScheduleEntriesByStart,
} from "@/lib/plan-types";
import { formatDateRange } from "@/lib/types";

interface PlanPreviewProps {
  data: ProjectPlanData;
}

function paragraph(text: string) {
  if (!text.trim()) return <span className="text-gray-400">(미입력)</span>;
  // 텍스트를 줄단위로 쪼개 렌더 — 정렬·삭제가 없는 read-only 출력이라 index key 안전
  return text.split("\n").map((line, i) => (
    <p key={`line-${i}`} className="leading-relaxed">
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
      <h1
        className={`mb-2 text-center text-2xl font-extrabold ${data.status === "archived" ? "text-gray-400 line-through" : ""}`}
      >
        {data.title || "(제목 미입력)"}
      </h1>
      <p className="mb-6 text-center text-xs text-gray-500">
        프로젝트 기획서 · {data.teamName || "팀"} · 작성자 {data.authorName || "이름"} · 작성일{" "}
        {data.createdDate} · 상태{" "}
        <span className="font-semibold text-gray-700">{PLAN_STATUS_LABEL[data.status]}</span>
      </p>

      <Section title="이해관계자">
        <StakeholdersBlock items={data.stakeholders} />
      </Section>

      {data.northStar.trim() && (
        <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-center">
          <div className="mb-1 text-xs font-semibold tracking-wide text-indigo-600">
            🌟 NORTH STAR
          </div>
          <p className="text-base font-semibold text-gray-900">{data.northStar}</p>
        </div>
      )}

      <Section title="성공 지표">
        <MetricsBlock items={data.successMetrics} />
      </Section>

      <Section title="1. 배경 / 필요성">{paragraph(data.background)}</Section>
      <Section title="2. 목표">{paragraph(data.objective)}</Section>
      <Section title="3. 범위">{paragraph(data.scope)}</Section>
      <Section title="4. 산출물">{paragraph(data.deliverables)}</Section>
      <Section title="5. 범위 외 (Non-goals)">{paragraph(data.nonGoals)}</Section>
      <Section title="6. 미결사항">
        <OpenQuestionsBlock items={data.openQuestions} />
      </Section>

      <Section title={`7. 일정 (${totalRange})`}>
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

      <Section title="8. 리스크">
        <RisksBlock items={data.risks} />
      </Section>
      <Section title="9. 기타">{paragraph(data.etc)}</Section>
      {data.changeLog.length > 0 && (
        <Section title="변경 이력">
          <ChangeLogBlock items={data.changeLog} />
        </Section>
      )}
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

function ChangeLogBlock({ items }: { items: ChangeLogEntry[] }) {
  const sorted = sortChangeLogDesc(items);
  return (
    <table className="w-full table-fixed border-collapse text-xs">
      <thead>
        <tr className="border-b-2 border-gray-300 text-left">
          <th className="w-24 py-2 pr-2 text-gray-500">날짜</th>
          <th className="w-24 py-2 pr-2 text-gray-500">작성자</th>
          <th className="py-2 text-gray-500">변경 요약</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((e) => (
          <tr key={e.id} className="border-b border-gray-100 align-top">
            <td className="py-2 pr-2 font-mono text-gray-500">{e.date}</td>
            <td className="py-2 pr-2 font-semibold">{e.author || "-"}</td>
            <td className="py-2 leading-relaxed">{e.summary || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StakeholdersBlock({ items }: { items: Stakeholder[] }) {
  if (items.length === 0) return <span className="text-gray-400">(등록된 이해관계자 없음)</span>;
  return (
    <table className="w-full table-fixed border-collapse text-xs">
      <thead>
        <tr className="border-b-2 border-gray-300 text-left">
          <th className="w-1/4 py-2 pr-2 text-gray-500">이름</th>
          <th className="py-2 pr-2 text-gray-500">역할</th>
          <th className="w-20 py-2 text-gray-500">책임</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id} className="border-b border-gray-100 align-top">
            <td className="py-2 pr-2 font-semibold">{s.name || "-"}</td>
            <td className="py-2 pr-2">{s.role || "-"}</td>
            <td className="py-2">{RESPONSIBILITY_LABEL[s.responsibility]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RisksBlock({ items }: { items: RiskItem[] }) {
  if (items.length === 0) return <span className="text-gray-400">(미입력)</span>;
  const sorted = sortRisksByScore(items);
  return (
    <table className="w-full table-fixed border-collapse text-xs">
      <thead>
        <tr className="border-b-2 border-gray-300 text-left">
          <th className="w-8 py-2 pr-2 text-gray-500">#</th>
          <th className="py-2 pr-2 text-gray-500">리스크</th>
          <th className="w-14 py-2 pr-2 text-gray-500">영향도</th>
          <th className="w-14 py-2 pr-2 text-gray-500">확률</th>
          <th className="w-12 py-2 pr-2 text-center text-gray-500">점수</th>
          <th className="w-1/3 py-2 text-gray-500">대응 방안</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r, idx) => (
          <tr key={r.id} className="border-b border-gray-100 align-top">
            <td className="py-2 pr-2 font-medium">{idx + 1}</td>
            <td className="py-2 pr-2 leading-relaxed whitespace-pre-wrap">
              {r.description || "-"}
            </td>
            <td className="py-2 pr-2">{RISK_LEVEL_LABEL[r.impact]}</td>
            <td className="py-2 pr-2">{RISK_LEVEL_LABEL[r.likelihood]}</td>
            <td className="py-2 pr-2 text-center font-bold">{computeRiskScore(r)}</td>
            <td className="py-2 leading-relaxed whitespace-pre-wrap">{r.mitigation || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MetricsBlock({ items }: { items: SuccessMetric[] }) {
  if (items.length === 0) return <span className="text-gray-400">(등록된 지표 없음)</span>;
  return (
    <table className="w-full table-fixed border-collapse text-xs">
      <thead>
        <tr className="border-b-2 border-gray-300 text-left">
          <th className="w-1/4 py-2 pr-2 text-gray-500">지표</th>
          <th className="w-1/6 py-2 pr-2 text-gray-500">목표값</th>
          <th className="py-2 pr-2 text-gray-500">측정방법</th>
          <th className="w-1/6 py-2 text-gray-500">시점</th>
        </tr>
      </thead>
      <tbody>
        {items.map((m) => (
          <tr key={m.id} className="border-b border-gray-100 align-top">
            <td className="py-2 pr-2 font-semibold">{m.name || "-"}</td>
            <td className="py-2 pr-2">{m.target || "-"}</td>
            <td className="py-2 pr-2 leading-relaxed">{m.method || "-"}</td>
            <td className="py-2">{m.timeline || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OpenQuestionsBlock({ items }: { items: OpenQuestionItem[] }) {
  if (items.length === 0) return <span className="text-gray-400">(미입력)</span>;
  const sorted = sortOpenQuestions(items);
  return (
    <ul className="space-y-1.5">
      {sorted.map((q) => (
        <li key={q.id} className="leading-relaxed">
          <span className="mr-1.5 inline-block w-4 align-text-top">{q.resolved ? "☑" : "☐"}</span>
          <span className={q.resolved ? "text-gray-500 line-through" : "font-medium text-gray-900"}>
            {q.question.trim() || "(빈 질문)"}
          </span>
          {q.resolved && q.resolution.trim() && (
            <div className="mt-0.5 ml-6 text-xs whitespace-pre-wrap text-gray-600">
              └ {q.resolution.trim()}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
