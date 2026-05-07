"use client";

import { useEffect, useRef } from "react";
import { RESPONSIBILITY_LABEL, type Responsibility, type Stakeholder } from "@/lib/plan-types";

interface PlanStakeholdersSectionProps {
  items: Stakeholder[];
  onAdd: () => void;
  onChange: (id: string, patch: Partial<Stakeholder>) => void;
  onRemove: (id: string) => void;
  /** 새로 추가된 stakeholder id — 마운트 시 name input에 자동 focus. */
  focusId?: string | null;
  onFocused?: () => void;
}

/**
 * 이해관계자 섹션 — 컴팩트 row list (이름 + 역할 + 책임 select).
 * 등록한 이름은 일정 entry의 assignee input에 datalist로 자동완성된다.
 */
export default function PlanStakeholdersSection({
  items,
  onAdd,
  onChange,
  onRemove,
  focusId,
  onFocused,
}: PlanStakeholdersSectionProps) {
  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600">
        👥 이해관계자
        <span className="ml-auto text-xs font-normal text-indigo-500">
          {items.length === 0
            ? "사용자 / 결정권자 / 협업팀 (이름은 일정 담당자에 자동완성됨)"
            : `${items.length}명`}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyHint />
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <StakeholderRow
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
        + 이해관계자 추가
      </button>
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-400">
      <p className="mb-1.5 font-medium text-gray-500">예시</p>
      <ul className="list-inside list-disc space-y-0.5">
        <li>김OO — PM — 오너</li>
        <li>이OO — 백엔드 — 기여자</li>
        <li>박OO — 디자인 리드 — 리뷰어</li>
      </ul>
    </div>
  );
}

interface RowProps {
  item: Stakeholder;
  autoFocus: boolean;
  onAutoFocused?: () => void;
  onChange: (patch: Partial<Stakeholder>) => void;
  onRemove: () => void;
}

function StakeholderRow({ item, autoFocus, onAutoFocused, onChange, onRemove }: RowProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) {
      nameRef.current?.focus();
      onAutoFocused?.();
    }
  }, [autoFocus, onAutoFocused]);

  return (
    <li className="group grid grid-cols-[1.2fr_1.5fr_1.2fr_auto] items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5">
      <input
        ref={nameRef}
        type="text"
        placeholder="이름"
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className="rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-gray-900 outline-none focus:border-indigo-400"
      />
      <input
        type="text"
        placeholder="역할 (예: PM, 백엔드)"
        value={item.role}
        onChange={(e) => onChange({ role: e.target.value })}
        className="rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-gray-700 outline-none focus:border-indigo-400"
      />
      <ResponsibilitySelect
        value={item.responsibility}
        onChange={(responsibility) => onChange({ responsibility })}
      />
      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
        title="삭제"
        aria-label="이해관계자 삭제"
      >
        ✕
      </button>
    </li>
  );
}

function ResponsibilitySelect({
  value,
  onChange,
}: {
  value: Responsibility;
  onChange: (value: Responsibility) => void;
}) {
  const colorByResp: Record<Responsibility, string> = {
    owner: "border-indigo-300 bg-indigo-50 text-indigo-700",
    contributor: "border-blue-300 bg-blue-50 text-blue-700",
    reviewer: "border-amber-300 bg-amber-50 text-amber-800",
    informed: "border-gray-300 bg-gray-100 text-gray-600",
  };
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Responsibility)}
      className={`cursor-pointer rounded-md border px-2 py-1 text-xs font-medium outline-none ${colorByResp[value]}`}
    >
      <option value="owner">{RESPONSIBILITY_LABEL.owner}</option>
      <option value="contributor">{RESPONSIBILITY_LABEL.contributor}</option>
      <option value="reviewer">{RESPONSIBILITY_LABEL.reviewer}</option>
      <option value="informed">{RESPONSIBILITY_LABEL.informed}</option>
    </select>
  );
}
