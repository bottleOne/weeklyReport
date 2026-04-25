import type { ReportData } from "@/lib/types";
import { ReportDataSchema } from "@/lib/schemas";
import { loadPersisted, clearPersisted, usePersistedState } from "./usePersistedState";

/**
 * 주간보고서 폼 자동저장 — usePersistedState의 도메인 wrapper.
 * 기존 호출처(`page.tsx`) 호환을 위해 동일 export 유지.
 */

const STORAGE_KEY = "weeklyReport:formState:v1";

export function loadPersistedReport(): ReportData | null {
  return loadPersisted(STORAGE_KEY, ReportDataSchema);
}

export function clearPersistedReport(): void {
  clearPersisted(STORAGE_KEY);
}

export function usePersistReport(data: ReportData): void {
  usePersistedState(STORAGE_KEY, data);
}
