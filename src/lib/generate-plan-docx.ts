import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  HeadingLevel,
  VerticalAlign,
} from "docx";
import type {
  ProjectPlanData,
  PlanScheduleEntry,
  OpenQuestionItem,
  SuccessMetric,
  RiskItem,
  Stakeholder,
} from "./plan-types";
import {
  TASK_STATUS_LABEL,
  RISK_LEVEL_LABEL,
  RESPONSIBILITY_LABEL,
  computeRiskScore,
  sortOpenQuestions,
  sortRisksByScore,
  sortScheduleEntriesByStart,
} from "./plan-types";
import { formatDateRange } from "./types";

const FONT_SIZE = 20; // 10pt
const HEADING_SIZE = 28; // 14pt
const TITLE_SIZE = 44; // 22pt

const border = { style: BorderStyle.SINGLE, size: 4, space: 0, color: "auto" };
const borders = { top: border, bottom: border, left: border, right: border };

const CELL_MARGINS = { top: 60, bottom: 60, left: 108, right: 108 };

function makeText(text: string, opts?: { bold?: boolean; size?: number }): TextRun {
  return new TextRun({
    text: text || "",
    bold: opts?.bold ?? false,
    size: opts?.size ?? FONT_SIZE,
  });
}

function paragraph(text: string, opts?: { bold?: boolean; size?: number }): Paragraph {
  return new Paragraph({
    spacing: { after: 80, line: 280 },
    children: [makeText(text, opts)],
  });
}

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [makeText(text, { bold: true, size: HEADING_SIZE })],
  });
}

function multilineParagraphs(text: string): Paragraph[] {
  if (!text.trim()) return [paragraph("(미입력)")];
  return text.split("\n").map((line) => paragraph(line));
}

/** 미결사항 list — 체크박스 + 질문 + (해결 시) 답변 들여쓰기. */
function openQuestionParagraphs(items: OpenQuestionItem[]): Paragraph[] {
  if (items.length === 0) return [paragraph("(미입력)")];
  const out: Paragraph[] = [];
  for (const q of sortOpenQuestions(items)) {
    const checkbox = q.resolved ? "☑" : "☐";
    const text = q.question.trim() || "(빈 질문)";
    out.push(paragraph(`${checkbox} ${text}`));
    if (q.resolved && q.resolution.trim()) {
      out.push(
        new Paragraph({
          spacing: { after: 80, line: 280 },
          indent: { left: 360 },
          children: [makeText(`└ ${q.resolution.trim()}`)],
        })
      );
    }
  }
  return out;
}

function cell(
  text: string,
  width: number,
  opts?: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }
): TableCell {
  return new TableCell({
    borders,
    margins: CELL_MARGINS,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    children: text.split("\n").map(
      (line) =>
        new Paragraph({
          spacing: { after: 0, line: 240 },
          alignment: opts?.align ?? AlignmentType.LEFT,
          children: [makeText(line, { bold: opts?.bold ?? false })],
        })
    ),
  });
}

function buildStakeholdersTable(items: Stakeholder[]): Table {
  const COL_NAME = 2400;
  const COL_ROLE = 3000;
  const COL_RESP = 1800;
  const TOTAL = COL_NAME + COL_ROLE + COL_RESP;

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell("이름", COL_NAME, { bold: true, align: AlignmentType.CENTER }),
      cell("역할", COL_ROLE, { bold: true, align: AlignmentType.CENTER }),
      cell("책임", COL_RESP, { bold: true, align: AlignmentType.CENTER }),
    ],
  });

  const dataRows: TableRow[] = items.length
    ? items.map(
        (s) =>
          new TableRow({
            children: [
              cell(s.name || "-", COL_NAME, { bold: true }),
              cell(s.role || "-", COL_ROLE),
              cell(RESPONSIBILITY_LABEL[s.responsibility], COL_RESP, {
                align: AlignmentType.CENTER,
              }),
            ],
          })
      )
    : [
        new TableRow({
          children: [cell("(등록된 이해관계자 없음)", TOTAL, { align: AlignmentType.CENTER })],
        }),
      ];

  return new Table({
    width: { size: TOTAL, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

function buildRisksTable(items: RiskItem[]): Table {
  const COL_NUM = 600;
  const COL_DESC = 3000;
  const COL_IMPACT = 1200;
  const COL_LIKE = 1200;
  const COL_SCORE = 800;
  const COL_MIT = 2200;
  const TOTAL = COL_NUM + COL_DESC + COL_IMPACT + COL_LIKE + COL_SCORE + COL_MIT;

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell("#", COL_NUM, { bold: true, align: AlignmentType.CENTER }),
      cell("리스크", COL_DESC, { bold: true, align: AlignmentType.CENTER }),
      cell("영향도", COL_IMPACT, { bold: true, align: AlignmentType.CENTER }),
      cell("확률", COL_LIKE, { bold: true, align: AlignmentType.CENTER }),
      cell("점수", COL_SCORE, { bold: true, align: AlignmentType.CENTER }),
      cell("대응 방안", COL_MIT, { bold: true, align: AlignmentType.CENTER }),
    ],
  });

  const dataRows: TableRow[] = items.length
    ? items.map(
        (r, idx) =>
          new TableRow({
            children: [
              cell(String(idx + 1), COL_NUM, { align: AlignmentType.CENTER }),
              cell(r.description || "-", COL_DESC),
              cell(RISK_LEVEL_LABEL[r.impact], COL_IMPACT, { align: AlignmentType.CENTER }),
              cell(RISK_LEVEL_LABEL[r.likelihood], COL_LIKE, { align: AlignmentType.CENTER }),
              cell(String(computeRiskScore(r)), COL_SCORE, {
                bold: true,
                align: AlignmentType.CENTER,
              }),
              cell(r.mitigation || "-", COL_MIT),
            ],
          })
      )
    : [
        new TableRow({
          children: [cell("(등록된 리스크 없음)", TOTAL, { align: AlignmentType.CENTER })],
        }),
      ];

  return new Table({
    width: { size: TOTAL, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

function buildMetricsTable(metrics: SuccessMetric[]): Table {
  const COL_NAME = 2400;
  const COL_TARGET = 2000;
  const COL_METHOD = 2800;
  const COL_TIMELINE = 1800;

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell("지표", COL_NAME, { bold: true, align: AlignmentType.CENTER }),
      cell("목표값", COL_TARGET, { bold: true, align: AlignmentType.CENTER }),
      cell("측정방법", COL_METHOD, { bold: true, align: AlignmentType.CENTER }),
      cell("시점", COL_TIMELINE, { bold: true, align: AlignmentType.CENTER }),
    ],
  });

  const dataRows: TableRow[] = metrics.length
    ? metrics.map(
        (m) =>
          new TableRow({
            children: [
              cell(m.name || "-", COL_NAME, { bold: true }),
              cell(m.target || "-", COL_TARGET, { align: AlignmentType.CENTER }),
              cell(m.method || "-", COL_METHOD),
              cell(m.timeline || "-", COL_TIMELINE, { align: AlignmentType.CENTER }),
            ],
          })
      )
    : [
        new TableRow({
          children: [
            cell("(등록된 지표 없음)", COL_NAME + COL_TARGET + COL_METHOD + COL_TIMELINE, {
              align: AlignmentType.CENTER,
            }),
          ],
        }),
      ];

  return new Table({
    width: { size: COL_NAME + COL_TARGET + COL_METHOD + COL_TIMELINE, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

function buildScheduleTable(entries: PlanScheduleEntry[]): Table {
  const COL_NUM = 600;
  const COL_RANGE = 2000;
  const COL_TITLE = 2800;
  const COL_ASSIGNEE = 1200;
  const COL_STATUS = 1000;
  const COL_DETAILS = 3400;

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      cell("#", COL_NUM, { bold: true, align: AlignmentType.CENTER }),
      cell("기간", COL_RANGE, { bold: true, align: AlignmentType.CENTER }),
      cell("제목", COL_TITLE, { bold: true, align: AlignmentType.CENTER }),
      cell("담당", COL_ASSIGNEE, { bold: true, align: AlignmentType.CENTER }),
      cell("상태", COL_STATUS, { bold: true, align: AlignmentType.CENTER }),
      cell("상세", COL_DETAILS, { bold: true, align: AlignmentType.CENTER }),
    ],
  });

  const dataRows: TableRow[] = entries.length
    ? entries.map((e, idx) => {
        const range = formatDateRange({ dateFrom: e.dateFrom, dateTo: e.dateTo }) || "-";
        return new TableRow({
          children: [
            cell(String(idx + 1), COL_NUM, { align: AlignmentType.CENTER }),
            cell(range, COL_RANGE, { align: AlignmentType.CENTER }),
            cell(e.title || "-", COL_TITLE),
            cell(e.assignee || "-", COL_ASSIGNEE, { align: AlignmentType.CENTER }),
            cell(TASK_STATUS_LABEL[e.status], COL_STATUS, { align: AlignmentType.CENTER }),
            cell(e.details || "-", COL_DETAILS),
          ],
        });
      })
    : [
        new TableRow({
          children: [
            cell(
              "(등록된 일정 없음)",
              COL_NUM + COL_RANGE + COL_TITLE + COL_ASSIGNEE + COL_STATUS + COL_DETAILS
            ),
          ],
        }),
      ];

  return new Table({
    width: {
      size: COL_NUM + COL_RANGE + COL_TITLE + COL_ASSIGNEE + COL_STATUS + COL_DETAILS,
      type: WidthType.DXA,
    },
    rows: [headerRow, ...dataRows],
  });
}

export async function generatePlanDocxBuffer(data: ProjectPlanData): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // 제목
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [makeText(data.title || "프로젝트 기획서", { bold: true, size: TITLE_SIZE })],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        makeText(
          `${data.teamName || "팀"} · 작성자 ${data.authorName || "이름"} · 작성일 ${data.createdDate}`,
          { size: 18 }
        ),
      ],
    })
  );

  // 헤더 영역: 이해관계자 + North Star + 성공 지표 (본문 번호 외)
  children.push(heading("이해관계자"));
  children.push(buildStakeholdersTable(data.stakeholders));
  children.push(paragraph(""));

  if (data.northStar.trim()) {
    children.push(heading("🌟 North Star"));
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [makeText(data.northStar, { bold: true, size: 24 })],
      })
    );
  }

  children.push(heading("성공 지표"));
  children.push(buildMetricsTable(data.successMetrics));
  children.push(paragraph(""));

  children.push(heading("1. 배경 / 필요성"));
  children.push(...multilineParagraphs(data.background));

  children.push(heading("2. 목표"));
  children.push(...multilineParagraphs(data.objective));

  children.push(heading("3. 범위"));
  children.push(...multilineParagraphs(data.scope));

  children.push(heading("4. 산출물"));
  children.push(...multilineParagraphs(data.deliverables));

  children.push(heading("5. 범위 외 (Non-goals)"));
  children.push(...multilineParagraphs(data.nonGoals));

  children.push(heading("6. 미결사항"));
  children.push(...openQuestionParagraphs(data.openQuestions));

  // 일정 (표)
  const totalRange =
    data.startDate || data.endDate ? ` (${data.startDate || ""} ~ ${data.endDate || ""})` : "";
  children.push(heading(`7. 일정${totalRange}`));
  children.push(buildScheduleTable(sortScheduleEntriesByStart(data.scheduleEntries)));
  children.push(paragraph(""));

  children.push(heading("8. 리스크"));
  children.push(buildRisksTable(sortRisksByScore(data.risks)));
  children.push(paragraph(""));

  children.push(heading("9. 기타"));
  children.push(...multilineParagraphs(data.etc));

  const doc = new Document({
    styles: {
      default: {
        document: { paragraph: { spacing: { after: 0, line: 280 } } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer as Buffer;
}
