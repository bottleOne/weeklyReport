"use client";

import { useEffect, useState } from "react";

export interface PlanTocItem {
  id: string; // 대상 section의 DOM id
  label: string;
}

interface PlanTocProps {
  items: PlanTocItem[];
}

/**
 * 기획서 우측 sticky ToC — IntersectionObserver로 현재 보이는 섹션을 강조.
 * lg(1024px+)에서만 노출. 클릭 시 smooth scroll.
 *
 * 부모 page.tsx는 각 섹션을 `<section id="...">`로 감싸야 한다 (PlanTocItem.id와 일치).
 */
export default function PlanToc({ items }: PlanTocProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (items.length === 0) return;

    const elements = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // 화면 상단 25% 지점에 들어온 섹션을 active로. 하단 50% 영역은 무시 (다음 섹션 진입 전 빠르게 active 전환).
    const observer = new IntersectionObserver(
      (entries) => {
        // 가장 위에 보이는 entry 선택
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      {
        rootMargin: "-20% 0px -50% 0px",
        threshold: 0,
      }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="기획서 섹션 목차"
      className="hidden lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <p className="mb-2 px-2 text-[11px] font-bold tracking-wide text-gray-400 uppercase">
          목차
        </p>
        <ul className="space-y-0.5">
          {items.map((it) => {
            const active = it.id === activeId;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => handleClick(it.id)}
                  className={`relative w-full cursor-pointer rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                    active
                      ? "bg-indigo-50 font-semibold text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-indigo-500"
                    />
                  )}
                  {it.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
