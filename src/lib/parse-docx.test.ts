import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parseDocxToReportData } from "./parse-docx";

const FIXTURES_DIR = path.join(__dirname, "__fixtures__");

function loadFixture(name: string): ArrayBuffer | null {
  const p = path.join(FIXTURES_DIR, name);
  if (!existsSync(p)) return null;
  const buf = readFileSync(p);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe("parseDocxToReportData", () => {
  it("rejects non-docx buffers", async () => {
    const garbage = new TextEncoder().encode("not a zip").buffer;
    await expect(parseDocxToReportData(garbage)).rejects.toThrow();
  });

  // 실제 픽스처 기반 회귀 테스트.
  // 픽스처 파일이 없으면 skip 처리됨. 픽스처 추가 방법은 __fixtures__/README.md.
  describe("with sample-employee.docx fixture", () => {
    const buffer = loadFixture("sample-employee.docx");

    it.skipIf(!buffer)("parses employee mode correctly", async () => {
      const data = await parseDocxToReportData(buffer!);
      expect(data.mode).toBe("employee");
      expect(data.meetingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(data.thisWeekTasks.length).toBeGreaterThan(0);
    });

    it.skipIf(!buffer)("preserves task title and content", async () => {
      const data = await parseDocxToReportData(buffer!);
      const firstTask = data.thisWeekTasks[0];
      expect(firstTask.title).toBeTruthy();
      expect(firstTask.contentLines.length).toBeGreaterThan(0);
    });

    it.skipIf(!buffer)("extracts target business / request team / period", async () => {
      const data = await parseDocxToReportData(buffer!);
      // 픽스처에 메타가 있을 때만 의미있음 — 비어 있어도 OK
      expect(typeof data.targetBusiness).toBe("string");
      expect(typeof data.requestTeam).toBe("string");
    });
  });

  describe("with sample-with-subdetails.docx fixture", () => {
    const buffer = loadFixture("sample-with-subdetails.docx");

    it.skipIf(!buffer)("parses subDetails under content lines", async () => {
      const data = await parseDocxToReportData(buffer!);
      const hasSubDetails = data.thisWeekTasks.some((t) =>
        t.contentLines.some((l) => l.subDetails.length > 0)
      );
      expect(hasSubDetails).toBe(true);
    });
  });
});
