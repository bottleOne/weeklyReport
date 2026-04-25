"use client";

interface MetaValues {
  targetBusiness: string;
  requestTeam: string;
  devPeriodFrom: string;
  devPeriodTo: string;
}

interface MetaSectionProps {
  values: MetaValues;
  accent: "blue" | "emerald";
  onChange: (field: keyof MetaValues, value: string) => void;
}

const ACCENT_BORDER = {
  blue: "focus:border-blue-500",
  emerald: "focus:border-emerald-500",
} as const;

/**
 * 대상업무 / 의뢰팀 / 개발기간 입력 묶음.
 * 사원 모드(금주/차주), 팀장 모드(금주/차주)에서 4번 사용됨.
 */
export default function MetaSection({ values, accent, onChange }: MetaSectionProps) {
  const focusBorder = ACCENT_BORDER[accent];
  const inputClass = `w-full rounded-md border border-gray-200 p-2 text-sm transition-colors outline-none ${focusBorder}`;
  const dateClass = `min-w-0 flex-1 rounded-md border border-gray-200 p-2 text-sm transition-colors outline-none ${focusBorder}`;

  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">대상업무</label>
          <input
            type="text"
            placeholder="예: kt비즈메카"
            value={values.targetBusiness}
            onChange={(e) => onChange("targetBusiness", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">의뢰팀</label>
          <input
            type="text"
            placeholder="예: 기획팀"
            value={values.requestTeam}
            onChange={(e) => onChange("requestTeam", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">개발기간</label>
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={values.devPeriodFrom}
            onChange={(e) => onChange("devPeriodFrom", e.target.value)}
            className={dateClass}
          />
          <span className="text-xs text-gray-400">~</span>
          <input
            type="date"
            value={values.devPeriodTo}
            onChange={(e) => onChange("devPeriodTo", e.target.value)}
            className={dateClass}
          />
        </div>
      </div>
    </>
  );
}
