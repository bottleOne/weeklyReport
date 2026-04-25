import { useEffect, useRef } from "react";
import type { ReportData } from "@/lib/types";
import { ReportDataSchema } from "@/lib/schemas";

const STORAGE_KEY = "weeklyReport:formState:v1";
const DEBOUNCE_MS = 500;

/** localStorage에서 폼 상태를 읽어 유효한 ReportData만 반환. 실패 시 null. */
export function loadPersistedReport(): ReportData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = ReportDataSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** 저장된 폼 상태를 비움 (초기화 버튼 등에서 호출). */
export function clearPersistedReport(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시 (시크릿 모드 등)
  }
}

/**
 * data가 바뀔 때마다 디바운스해서 localStorage에 저장.
 * SSR 안전: window 존재 시에만 동작.
 */
export function usePersistReport(data: ReportData): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // 용량 초과/시크릿 모드 등 — 무시
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data]);
}
