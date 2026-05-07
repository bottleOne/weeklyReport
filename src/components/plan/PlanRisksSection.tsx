"use client";

import { useEffect, useRef, useState } from "react";
import {
  RISK_LEVEL_LABEL,
  computeRiskScore,
  sortRisksByScore,
  type RiskItem,
  type RiskLevel,
} from "@/lib/plan-types";

interface PlanRisksSectionProps {
  items: RiskItem[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<RiskItem>) => void;
  onRemove: (id: string) => void;
  /** 새로 추가된 risk id — 마운트 시 description input에 자동 focus. */
  focusId?: string | null;
  onFocused?: () => void;
}

/**
 * 리스크 섹션 — 영향도/확률/완화책 카드 list.
 * 정렬 기본은 위험도 점수(impact × likelihood) 내림차순. 토글로 입력순 가능.
 */
export default function PlanRisksSection({
  items,
  onAdd,
  onChange,
  onRemove,
  focusId,
  onFocused,
}: PlanRisksSectionProps) {
  const [sortByScore, setSortByScore] = useState(true);
  const visible = sortByScore ? sortRisksByScore(items) : items;

  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
        ⚠️ 리스크
        <span className="ml-auto flex items-center gap-2 text-xs font-normal text-indigo-500">
          {items.length === 0 ? (
            "예측 가능한 리스크와 대응 방안"
          ) : (
            <>
              <span>{items.length}건</span>
              <button
                type="button"
                onClick={() => setSortByScore((v) => !v)}
                className="cursor-pointer rounded-md border border-indigo-200 bg-white px-2 py-0.5 text-xs text-indigo-600 transition-colors hover:bg-indigo-50"
                title="정렬 기준 전환"
              >
                정렬: {sortByScore ? "위험도 ↓" : "추가순"}
              </button>
            </>
          )}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyHint />
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <RiskCard
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
        + 리스크 추가
      </button>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-400">
      <p className="mb-1.5 font-medium text-gray-500">예시</p>
      <ul className="list-inside list-disc space-y-0.5">
        <li>외부 API 응답 지연 — 영향: 중 / 확률: 중 / 대응: 캐시 fallback</li>
        <li>레거시 데이터 정합성 부족 — 영향: 높음 / 확률: 중 / 대응: 사전 정제 스크립트</li>
        <li>출시 시점 인력 부족 — 영향: 높음 / 확률: 낮음 / 대응: 부분 외주</li>
      </ul>
    </div>
  );
}

interface CardProps {
  item: RiskItem;
  autoFocus: boolean;
  onAutoFocused?: () => void;
  onChange: (patch: Partial<RiskItem>) => void;
  onRemove: () => void;
}

function RiskCard({ item, autoFocus, onAutoFocused, onChange, onRemove }: CardProps) {
  const descRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus) {
      descRef.current?.focus();
      onAutoFocused?.();
    }
  }, [autoFocus, onAutoFocused]);

  const score = computeRiskScore(item);

  return (
    <li className="group rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm">
      <div className="mb-2 flex items-start gap-2">
        <textarea
          ref={descRef}
          placeholder="리스크 내용 (예: 외부 API 응답 지연)"
          value={item.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className="min-h-[40px] flex-1 resize-y border-b border-gray-300 bg-transparent pb-0.5 text-sm font-medium text-gray-900 outline-none focus:border-indigo-500"
        />
        <RiskScorePill score={score} />
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
          title="삭제"
          aria-label="리스크 삭제"
        >
          ✕
        </button>
      </div>
      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <LevelSelect
          label="영향도"
          value={item.impact}
          onChange={(impact) => onChange({ impact })}
        />
        <LevelSelect
          label="발생 확률"
          value={item.likelihood}
          onChange={(likelihood) => onChange({ likelihood })}
        />
      </div>
      <div>
        <label className="mb-0.5 block text-[11px] font-semibold text-gray-500">대응 방안</label>
        <textarea
          placeholder="예: 외부 API 장애 시 캐시된 데이터로 fallback"
          value={item.mitigation}
          onChange={(e) => onChange({ mitigation: e.target.value })}
          className="min-h-[48px] w-full resize-y rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
        />
      </div>
    </li>
  );
}

interface LevelSelectProps {
  label: string;
  value: RiskLevel;
  onChange: (value: RiskLevel) => void;
}

function LevelSelect({ label, value, onChange }: LevelSelectProps) {
  const colorByLevel: Record<RiskLevel, string> = {
    low: "border-gray-300 bg-gray-100 text-gray-700",
    medium: "border-amber-300 bg-amber-50 text-amber-800",
    high: "border-red-300 bg-red-50 text-red-700",
  };
  return (
    <div>
      <label className="mb-0.5 block text-[11px] font-semibold text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as RiskLevel)}
        className={`w-full cursor-pointer rounded-md border px-2 py-1.5 text-sm font-medium outline-none ${colorByLevel[value]}`}
      >
        <option value="low">{RISK_LEVEL_LABEL.low}</option>
        <option value="medium">{RISK_LEVEL_LABEL.medium}</option>
        <option value="high">{RISK_LEVEL_LABEL.high}</option>
      </select>
    </div>
  );
}

/** 위험도 점수 badge — 1~3 회색, 4~6 amber, 7~9 red. */
function RiskScorePill({ score }: { score: number }) {
  const tone =
    score >= 7
      ? "bg-red-100 text-red-700 border-red-300"
      : score >= 4
        ? "bg-amber-100 text-amber-800 border-amber-300"
        : "bg-gray-100 text-gray-600 border-gray-300";
  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${tone}`}
      title={`위험도 ${score} (영향도 × 확률)`}
    >
      {score}
    </span>
  );
}
