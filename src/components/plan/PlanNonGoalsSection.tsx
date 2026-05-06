"use client";

interface PlanNonGoalsSectionProps {
  value: string;
  onChange: (value: string) => void;
}

const PLACEHOLDER = `예: 모바일 앱 출시 (별도 프로젝트)
예: i18n 다국어 지원
예: 결제/구독 통합`;

/**
 * 범위 외(Non-goals) — 의도적으로 빼는 항목을 명시.
 * 짧은 문장 위주라 줄단위 textarea로 받는다.
 */
export default function PlanNonGoalsSection({ value, onChange }: PlanNonGoalsSectionProps) {
  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
        🚫 범위 외 (Non-goals)
        <span className="ml-auto text-xs font-normal text-indigo-500">
          이 프로젝트에서 의도적으로 다루지 않을 항목
        </span>
      </div>
      <textarea
        placeholder={PLACEHOLDER}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[100px] w-full resize-y rounded-md border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500"
      />
      <p className="mt-1 text-xs text-gray-400">
        한 줄에 한 항목씩. 범위 협상의 안전장치가 됩니다.
      </p>
    </div>
  );
}
