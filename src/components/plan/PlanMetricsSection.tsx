"use client";

import { useEffect, useRef } from "react";
import type { SuccessMetric } from "@/lib/plan-types";

interface PlanMetricsSectionProps {
  items: SuccessMetric[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<SuccessMetric>) => void;
  onRemove: (id: string) => void;
  /** 새로 추가된 metric id — 마운트 시 name input에 자동 focus. */
  focusId?: string | null;
  onFocused?: () => void;
}

/**
 * 성공 지표 — 측정 가능한 목표를 카드 list로.
 * 빈 상태에서는 회색 예시 1개를 점선 카드로 보여준다.
 */
export default function PlanMetricsSection({
  items,
  onAdd,
  onChange,
  onRemove,
  focusId,
  onFocused,
}: PlanMetricsSectionProps) {
  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
        📊 성공 지표
        <span className="ml-auto text-xs font-normal text-indigo-500">
          {items.length === 0 ? "측정 가능한 목표 + 측정방법 + 시점" : `${items.length}개 지표`}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyHint />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <MetricCard
              key={item.id}
              item={item}
              autoFocus={focusId === item.id}
              onAutoFocused={onFocused}
              onChange={(patch) => onChange(item.id, patch)}
              onRemove={() => onRemove(item.id)}
            />
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 w-full cursor-pointer rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
      >
        + 지표 추가
      </button>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-400">
      <p className="mb-1.5 font-medium text-gray-500">예시</p>
      <ul className="list-inside list-disc space-y-0.5">
        <li>주간 활성 사용자 300명 — GA 측정 — 출시 후 4주</li>
        <li>보고서 작성 시간 평균 30분 이하 — 사용자 설문 — 출시 후 8주</li>
        <li>업무 처리 오류율 1% 이하 — 운영 로그 집계 — 분기별</li>
      </ul>
    </div>
  );
}

interface CardProps {
  item: SuccessMetric;
  autoFocus: boolean;
  onAutoFocused?: () => void;
  onChange: (patch: Partial<SuccessMetric>) => void;
  onRemove: () => void;
}

function MetricCard({ item, autoFocus, onAutoFocused, onChange, onRemove }: CardProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) {
      nameRef.current?.focus();
      onAutoFocused?.();
    }
  }, [autoFocus, onAutoFocused]);

  return (
    <li className="group rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <input
          ref={nameRef}
          type="text"
          placeholder="지표 이름 (예: 주간 활성 사용자)"
          value={item.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex-1 border-b border-gray-300 bg-transparent pb-0.5 text-sm font-semibold text-gray-900 outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
          title="삭제"
          aria-label="지표 삭제"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field
          label="목표값"
          placeholder="예: 300명"
          value={item.target}
          onChange={(v) => onChange({ target: v })}
        />
        <Field
          label="측정방법"
          placeholder="예: GA 이벤트"
          value={item.method}
          onChange={(v) => onChange({ method: v })}
        />
        <Field
          label="시점"
          placeholder="예: 출시 후 4주"
          value={item.timeline}
          onChange={(v) => onChange({ timeline: v })}
        />
      </div>
    </li>
  );
}

interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function Field({ label, placeholder, value, onChange }: FieldProps) {
  return (
    <div>
      <label className="mb-0.5 block text-[11px] font-semibold text-gray-500">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
      />
    </div>
  );
}
