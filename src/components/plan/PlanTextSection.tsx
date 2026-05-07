"use client";

/** 본문 textarea로 다룰 수 있는 필드 키 — 좁은 union으로 호출자에게 강제. */
export type PlanBodyField = "background" | "objective" | "scope" | "deliverables";

interface TextField {
  key: PlanBodyField;
  label: string;
  placeholder: string;
  value: string;
}

interface PlanTextSectionProps {
  fields: TextField[];
  onChange: (key: PlanBodyField, value: string) => void;
}

/**
 * 본문 4섹션(배경/목표/범위/산출물) 일괄 렌더.
 * 이해관계자는 Phase 4에서 구조화 카드로 분리되어 여기 포함되지 않는다.
 */
export default function PlanTextSection({ fields, onChange }: PlanTextSectionProps) {
  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
        🎯 기획 본문
      </div>
      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-semibold text-gray-700">{f.label}</label>
            <textarea
              placeholder={f.placeholder}
              value={f.value}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="min-h-[80px] w-full resize-y rounded-md border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
