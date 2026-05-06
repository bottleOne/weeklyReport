"use client";

interface PlanNorthStarCardProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * North Star — 프로젝트 성공의 한 줄 정의.
 * 정보 헤더 직후, 큰 카드로 강조해 가장 먼저 보이게 한다.
 */
export default function PlanNorthStarCard({ value, onChange }: PlanNorthStarCardProps) {
  return (
    <div className="mb-5 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-700">
        🌟 North Star
        <span className="ml-auto text-xs font-normal text-indigo-500">
          이 프로젝트가 성공하면 무엇이 달라지는가
        </span>
      </div>
      <input
        type="text"
        placeholder="예: 보고서 작성 시간 평균 2h → 30분 (75% 단축)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-1 text-center text-lg font-semibold text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-300 placeholder:italic"
      />
    </div>
  );
}
