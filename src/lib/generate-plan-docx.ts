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
import type { ProjectPlanData, Milestone } from "./plan-types";
import { TASK_STATUS_LABEL } from "./plan-types";
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
    children: [
      new Paragraph({
        spacing: { after: 0, line: 240 },
        alignment: opts?.align ?? AlignmentType.LEFT,
        children: [makeText(text, { bold: opts?.bold ?? false })],
      }),
    ],
  });
}

function buildMilestoneTable(milestone: Milestone): Table {
  const COL_TITLE = 4500;
  const COL_ASSIGNEE = 1400;
  const COL_RANGE = 2400;
  const COL_STATUS = 1200;
  const COL_NOTES = 1500;

  const headerRow = new TableRow({
    children: [
      cell("작업", COL_TITLE, { bold: true, align: AlignmentType.CENTER }),
      cell("담당", COL_ASSIGNEE, { bold: true, align: AlignmentType.CENTER }),
      cell("기간", COL_RANGE, { bold: true, align: AlignmentType.CENTER }),
      cell("상태", COL_STATUS, { bold: true, align: AlignmentType.CENTER }),
      cell("메모", COL_NOTES, { bold: true, align: AlignmentType.CENTER }),
    ],
  });

  const taskRows = milestone.tasks.map((t) => {
    const range = formatDateRange({ dateFrom: t.dateFrom, dateTo: t.dateTo }) || "-";
    return new TableRow({
      children: [
        cell(t.title || "-", COL_TITLE),
        cell(t.assignee || "-", COL_ASSIGNEE, { align: AlignmentType.CENTER }),
        cell(range, COL_RANGE, { align: AlignmentType.CENTER }),
        cell(TASK_STATUS_LABEL[t.status], COL_STATUS, { align: AlignmentType.CENTER }),
        cell(t.notes || "-", COL_NOTES),
      ],
    });
  });

  return new Table({
    width: {
      size: COL_TITLE + COL_ASSIGNEE + COL_RANGE + COL_STATUS + COL_NOTES,
      type: WidthType.DXA,
    },
    rows: [headerRow, ...taskRows],
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

  children.push(heading("1. 배경 / 필요성"));
  children.push(...multilineParagraphs(data.background));

  children.push(heading("2. 목표"));
  children.push(...multilineParagraphs(data.objective));

  children.push(heading("3. 범위"));
  children.push(...multilineParagraphs(data.scope));

  children.push(heading("4. 이해관계자"));
  children.push(...multilineParagraphs(data.stakeholders));

  children.push(heading("5. 산출물"));
  children.push(...multilineParagraphs(data.deliverables));

  // 일정
  const totalRange =
    data.startDate || data.endDate ? ` (${data.startDate || ""} ~ ${data.endDate || ""})` : "";
  children.push(heading(`6. 일정${totalRange}`));

  if (data.milestones.length === 0) {
    children.push(paragraph("(마일스톤 없음)"));
  } else {
    data.milestones.forEach((m, mi) => {
      const range = formatDateRange({ dateFrom: m.dateFrom, dateTo: m.dateTo });
      const titleLine = `${mi + 1}) ${m.title || "(마일스톤 미입력)"}${range ? ` — ${range}` : ""}`;
      children.push(paragraph(titleLine, { bold: true }));
      if (m.description) {
        children.push(paragraph(m.description));
      }
      children.push(buildMilestoneTable(m));
      children.push(paragraph(""));
    });
  }

  children.push(heading("7. 리스크"));
  children.push(...multilineParagraphs(data.risks));

  children.push(heading("8. 기타"));
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
