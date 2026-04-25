import { useEffect, useRef } from "react";
import type { ZodType } from "zod";

const DEFAULT_DEBOUNCE_MS = 500;

/**
 * localStorage에서 키 값을 읽어 zod 스키마로 검증한 결과를 반환.
 * 키가 없거나 검증 실패 시 null.
 */
export function loadPersisted<T>(key: string, schema: ZodType<T>): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** 저장된 키를 비움. */
export function clearPersisted(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 시크릿 모드 등 — 무시
  }
}

/**
 * data가 바뀔 때마다 디바운스해서 localStorage에 저장.
 * SSR 안전. 스키마는 저장 전 직렬화에는 사용 안 함 (이미 타입 보장됨).
 */
export function usePersistedState<T>(key: string, data: T, debounceMs = DEFAULT_DEBOUNCE_MS): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
      } catch {
        // 용량 초과/시크릿 모드 등 — 무시
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, data, debounceMs]);
}
