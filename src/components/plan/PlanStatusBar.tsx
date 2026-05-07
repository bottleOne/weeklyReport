"use client";

import { PLAN_STATUS_LABEL, type PlanStatus } from "@/lib/plan-types";

interface PlanStatusBarProps {
  status: PlanStatus;
  onChange: (next: PlanStatus) => void;
}

/**
 * 헤더에 노출되는 status pill — select가 자체로 컬러 칩이 됨.
 * 상태 전환 시 부모(page.tsx)가 changeLog에 자동 항목을 append한다.
 */
export default function PlanStatusBar({ status, onChange }: PlanStatusBarProps) {
  const colorByStatus: Record<PlanStatus, string> = {
    draft: "border-gray-300 bg-gray-100 text-gray-700",
    review: "border-amber-300 bg-amber-50 text-amber-800",
    approved: "border-emerald-300 bg-emerald-50 text-emerald-700",
    archived: "border-gray-300 bg-gray-50 text-gray-400 line-through",
  };
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as PlanStatus)}
      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition-colors outline-none ${colorByStatus[status]}`}
      title="문서 상태 변경"
      aria-label="문서 상태"
    >
      <option value="draft">{PLAN_STATUS_LABEL.draft}</option>
      <option value="review">{PLAN_STATUS_LABEL.review}</option>
      <option value="approved">{PLAN_STATUS_LABEL.approved}</option>
      <option value="archived">{PLAN_STATUS_LABEL.archived}</option>
    </select>
  );
}
