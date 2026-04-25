import JSZip from "jszip";
import type { TaskItem, ContentLine, SubDetail, ReportData } from "./types";
import { createEmptyContentLine, createEmptyTask, newId } from "./types";

/**
 * .docx 파일(ArrayBuffer)을 파싱하여 ReportData로 변환
 * 원본 주간업무 테이블 구조:
 *   Row 0: 회의기준일 | 날짜 | 팀명/이름 | 팀/이름
 *   Row 1: 구분 | 금주 | 차주
 *   Row 2: 업무 | 금주내용 | 차주내용
 *   Row 3: 주요이슈 | 내용 | 내용
 *   Row 4: 기타 | 내용 | 내용
 */
export async function parseDocxToReportData(
  buffer: ArrayBuffer
): Promise<ReportData> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file("word/document.xml")?.async("string");

  if (!documentXml) {
    throw new Error("document.xml not found in .docx file");
  }

  // 테이블의 행(row)들을 추출
  const rows = extractTableRows(documentXml);

  if (rows.length < 5) {
    throw new Error(
      "주간업무 테이블을 찾을 수 없습니다. 올바른 양식인지 확인해주세요."
    );
  }

  // Row 0: 회의기준일, 팀명/이름
  const row0Cells = extractCellTexts(rows[0]);
  const rawDate = row0Cells[1]?.text.trim() || "";
  const rawTeamName = row0Cells[3]?.text.trim() || "";

  const meetingDate = extractDate(rawDate);
  const [teamName, authorName] = parseTeamAndName(rawTeamName);
  const year = meetingDate ? meetingDate.slice(0, 4) : String(new Date().getFullYear());

  // Row 2: 업무 내용 (금주 / 차주)
  const row2Cells = extractCellParagraphs(rows[2]);
  const thisWeekParas = row2Cells[1] || [];
  const nextWeekParas = row2Cells[2] || [];

  const thisWeekResult = parseTasksFromParagraphs(thisWeekParas, year);
  const nextWeekResult = parseTasksFromParagraphs(nextWeekParas, year);

  // Row 3: 주요이슈
  const row3Cells = extractCellTexts(rows[3]);
  const issues = row3Cells[1]?.text.trim() || "";

  // Row 4: 기타
  const row4Cells = extractCellTexts(rows[4]);
  const etc = row4Cells[1]?.text.trim() || "";

  return {
    mode: "employee" as const,
    meetingDate,
    teamName,
    authorName,
    thisWeekTasks:
      thisWeekResult.tasks.length > 0
        ? thisWeekResult.tasks
        : [createEmptyTask()],
    nextWeekTasks:
      nextWeekResult.tasks.length > 0
        ? nextWeekResult.tasks
        : [createEmptyTask()],
    members: [],
    targetBusiness: thisWeekResult.targetBusiness,
    requestTeam: thisWeekResult.requestTeam,
    devPeriodFrom: thisWeekResult.devPeriodFrom,
    devPeriodTo: thisWeekResult.devPeriodTo,
    nextTargetBusiness: nextWeekResult.targetBusiness,
    nextRequestTeam: nextWeekResult.requestTeam,
    nextDevPeriodFrom: nextWeekResult.devPeriodFrom,
    nextDevPeriodTo: nextWeekResult.devPeriodTo,
    issues,
    etc,
  };
}

interface ParsedTaskResult {
  tasks: TaskItem[];
  targetBusiness: string;
  requestTeam: string;
  devPeriodFrom: string;
  devPeriodTo: string;
}

/** 파싱된 paragraph 정보 */
interface ParaInfo {
  text: string;
  isNumbered: boolean; // Word 자동 번호매기기 (w:numPr)
}

// ==================== XML 파싱 유틸 ====================

/** XML에서 <w:tr> 블록들을 추출 */
function extractTableRows(xml: string): string[] {
  const rows: string[] = [];
  const rowRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
  let match;
  while ((match = rowRegex.exec(xml)) !== null) {
    rows.push(match[0]);
  }
  return rows;
}

/** 하나의 <w:tr>에서 각 <w:tc>의 텍스트를 추출 (단순 텍스트용) */
function extractCellTexts(
  rowXml: string
): { text: string }[] {
  const cells: { text: string }[] = [];
  const cellRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
  let match;
  while ((match = cellRegex.exec(rowXml)) !== null) {
    cells.push({ text: extractPlainText(match[0]) });
  }
  return cells;
}

/** 하나의 <w:tr>에서 각 <w:tc>의 paragraph 배열을 추출 (구조 파싱용) */
function extractCellParagraphs(rowXml: string): ParaInfo[][] {
  const cells: ParaInfo[][] = [];
  const cellRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
  let match;
  while ((match = cellRegex.exec(rowXml)) !== null) {
    cells.push(extractParagraphs(match[0]));
  }
  return cells;
}

/** XML 블록에서 plain text 추출 */
function extractPlainText(xml: string): string {
  const lines: string[] = [];
  const paragraphRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let pMatch;
  while ((pMatch = paragraphRegex.exec(xml)) !== null) {
    const texts: string[] = [];
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let tMatch;
    while ((tMatch = textRegex.exec(pMatch[0])) !== null) {
      texts.push(tMatch[1]);
    }
    lines.push(texts.join(""));
  }
  return lines.join("\n");
}

/** XML 블록에서 paragraph 배열 추출 (번호매기기 정보 포함) */
function extractParagraphs(xml: string): ParaInfo[] {
  const paras: ParaInfo[] = [];
  const paragraphRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let pMatch;
  while ((pMatch = paragraphRegex.exec(xml)) !== null) {
    const pXml = pMatch[0];
    const isNumbered = pXml.includes("w:numPr");
    const texts: string[] = [];
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let tMatch;
    while ((tMatch = textRegex.exec(pXml)) !== null) {
      texts.push(tMatch[1]);
    }
    paras.push({ text: texts.join(""), isNumbered });
  }
  return paras;
}

// ==================== 날짜/팀 파싱 ====================

function extractDate(raw: string): string {
  const match = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return match[0];
  const match2 = raw.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (match2) return `${match2[1]}-${match2[2]}-${match2[3]}`;
  return "";
}

function parseTeamAndName(raw: string): [string, string] {
  const parts = raw.split(/\s*\/\s*/);
  return [parts[0]?.trim() || "", parts[1]?.trim() || ""];
}

function normalizeDate(raw: string): string {
  const m1 = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m1) return m1[0];
  const m2 = raw.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return "";
}

// ==================== 업무 파싱 (핵심 로직) ====================

/**
 * 날짜 패턴 추출: "(10.24 ~ 10.28)", "(10.28)", "(10.30~)" 등
 * 반환: [본문텍스트, dateFrom(YYYY-MM-DD), dateTo(YYYY-MM-DD)]
 */
function extractDateFromText(text: string, year: string): [string, string, string] {
  const datePattern =
    /\((\d{1,2}\.\d{1,2}(?:\s*~\s*\d{1,2}\.\d{1,2})?~?)\)\s*$/;
  const m = text.match(datePattern);
  if (m) {
    const rawDate = m[1];
    const cleanText = text.replace(m[0], "").trim();
    const parts = rawDate.split(/\s*~\s*/);
    const dateFrom = mmddToYmd(parts[0]?.trim() || "", year);
    const dateTo = mmddToYmd(parts[1]?.trim() || "", year);
    return [cleanText, dateFrom, dateTo];
  }
  return [text, "", ""];
}

/** "MM.DD" → "YYYY-MM-DD" */
function mmddToYmd(mmdd: string, year: string): string {
  if (!mmdd) return "";
  const match = mmdd.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (!match) return "";
  const mm = match[1].padStart(2, "0");
  const dd = match[2].padStart(2, "0");
  return `${year || new Date().getFullYear()}-${mm}-${dd}`;
}

/** paragraph 배열에서 업무 항목을 파싱 */
function parseTasksFromParagraphs(paras: ParaInfo[], year: string): ParsedTaskResult {
  const tasks: TaskItem[] = [];

  let currentTask: { title: string } | null = null;
  let contentLines: ContentLine[] = [];
  let isInContent = false;

  let targetBusiness = "";
  let requestTeam = "";
  let devPeriodFrom = "";
  let devPeriodTo = "";

  const flushTask = () => {
    if (currentTask) {
      tasks.push({
        id: newId(),
        title: currentTask.title || "",
        contentLines:
          contentLines.length > 0 ? contentLines : [createEmptyContentLine()],
      });
    }
    currentTask = null;
    contentLines = [];
    isInContent = false;
  };

  for (let i = 0; i < paras.length; i++) {
    const { text, isNumbered } = paras[i];
    const trimmed = text.trim();
    if (!trimmed) continue;

    // ---- 메타 정보 (대상업무/의뢰팀/개발기간) ----
    const targetMatch = trimmed.match(/^대상업무\s*:\s*(.+)/);
    if (targetMatch) {
      targetBusiness = targetMatch[1].trim();
      isInContent = false;
      continue;
    }
    const teamMatch = trimmed.match(/의뢰팀\s*:\s*(.+)/);
    if (teamMatch) {
      requestTeam = teamMatch[1].trim();
      isInContent = false;
      continue;
    }
    const periodMatch = trimmed.match(/개발기간\s*:\s*(.+)/);
    if (periodMatch) {
      const periodStr = periodMatch[1].trim();
      const dates = periodStr.split(/\s*~\s*/);
      if (dates[0]) devPeriodFrom = normalizeDate(dates[0].trim());
      if (dates[1]) devPeriodTo = normalizeDate(dates[1].trim());
      isInContent = false;
      continue;
    }

    // ---- "1. 업무제목" 패턴 → 새 업무 시작 ----
    const taskMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (taskMatch) {
      flushTask();
      currentTask = { title: taskMatch[2].trim() };
      continue;
    }

    if (!currentTask) continue;

    // ---- "내용 :" → 내용 섹션 시작 ----
    if (trimmed.startsWith("내용") && trimmed.includes(":")) {
      isInContent = true;
      continue;
    }

    // ---- "1) xxx" 패턴 → 내용 섹션 자동 전환 ----
    if (!isInContent && trimmed.match(/^\d+\)\s*/)) {
      isInContent = true;
    }

    // ---- Word 자동 번호매기기(w:numPr) → 내용 항목 ----
    if (!isInContent && isNumbered) {
      isInContent = true;
    }

    // ---- 내용 파싱 ----
    if (isInContent && trimmed) {
      // "1) xxx" 텍스트 번호 제거
      const numItem = trimmed.match(/^\d+\)\s*(.+)/);
      const rawText = numItem ? numItem[1] : trimmed;

      // "- xxx" → 마지막 content line의 subDetails로 추가
      if (rawText.startsWith("- ")) {
        const subText = rawText.slice(2).trim();
        const [lineText, lineFrom, lineTo] = extractDateFromText(subText, year);
        if (lineText) {
          const sub: SubDetail = {
            id: newId(),
            text: lineText,
            dateFrom: lineFrom,
            dateTo: lineTo,
          };
          if (contentLines.length > 0) {
            contentLines[contentLines.length - 1].subDetails.push(sub);
          } else {
            // content line이 없으면 빈 줄 하나 만들고 sub 추가
            const newLine: ContentLine = {
              id: newId(),
              text: "",
              dateFrom: "",
              dateTo: "",
              subDetails: [sub],
            };
            contentLines.push(newLine);
          }
        }
        continue;
      }

      // 번호 없고 "-"도 아닌 일반 텍스트인데,
      // 앞 줄이 끊긴 문장일 수 있음 (Word에서 줄바꿈 된 경우)
      if (
        !numItem &&
        !isNumbered &&
        !rawText.startsWith("- ") &&
        contentLines.length > 0
      ) {
        // 이전 줄에 이어 붙이기 (줄바꿈으로 끊긴 문장)
        const last = contentLines[contentLines.length - 1];
        const combined = last.text + " " + rawText;
        const [finalText, finalFrom, finalTo] = extractDateFromText(combined, year);
        last.text = finalText;
        if (finalFrom) last.dateFrom = finalFrom;
        if (finalTo) last.dateTo = finalTo;
        continue;
      }

      // 새 내용 줄 추가
      const [lineText, lineFrom, lineTo] = extractDateFromText(rawText, year);

      contentLines.push({
        id: newId(),
        text: lineText,
        dateFrom: lineFrom,
        dateTo: lineTo,
        subDetails: [],
      });
    }
  }

  flushTask();

  return { tasks, targetBusiness, requestTeam, devPeriodFrom, devPeriodTo };
}
