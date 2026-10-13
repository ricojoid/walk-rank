import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { buildAdminLogsWhere } from "@/lib/logFilters";

// Daily cap: max 10000 steps counted per day (same rule as leaderboard & analytics)
const DAILY_CAP = 10000;
// Timestamps are shown in Jakarta time (WIB, UTC+7)
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

const BRAND_RED = "FFDC2626";
const HEADER_TEXT = "FFFFFFFF";
const ZEBRA_FILL = "FFF8FAFC";
const BORDER_COLOR = "FFE2E8F0";
const MET_FILL = "FFDCFCE7";
const MET_TEXT = "FF166534";
const MISSED_FILL = "FFFEF3C7";
const MISSED_TEXT = "FF92400E";

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
};

function describeDateFilter(searchParams: URLSearchParams) {
  const dates = (searchParams.get("dates") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
    .sort();
  if (dates.length > 0) return `${dates.length} selected day(s): ${dates.join(", ")}`;

  const s = searchParams.get("startDate");
  const e = searchParams.get("endDate");
  if (s || e) return `${s || "…"} to ${e || "…"}`;
  return "All dates";
}

function fileSuffix(searchParams: URLSearchParams) {
  const dates = (searchParams.get("dates") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
    .sort();
  if (dates.length === 1) return dates[0];
  if (dates.length > 1) return `${dates[0]}_to_${dates[dates.length - 1]}_${dates.length}days`;

  const s = searchParams.get("startDate");
  const e = searchParams.get("endDate");
  if (s && e) return s === e ? s : `${s}_to_${e}`;
  return "all";
}

/** Title block (title, filter info, generated time) above a table, merged across its width. */
function addTitleBlock(sheet: ExcelJS.Worksheet, title: string, lines: string[], width: number) {
  sheet.mergeCells(1, 1, 1, width);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: BRAND_RED } };
  titleCell.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 28;

  lines.forEach((line, i) => {
    const row = i + 2;
    sheet.mergeCells(row, 1, row, width);
    const cell = sheet.getCell(row, 1);
    cell.value = line;
    cell.font = { name: "Calibri", size: 10, color: { argb: "FF475569" } };
  });

  return lines.length + 3; // header row index (one blank spacer row)
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: HEADER_TEXT } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_RED } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = thinBorder;
  });
}

function styleBodyRow(row: ExcelJS.Row, index: number) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: "Calibri", size: 10, ...(cell.font || {}) };
    cell.border = thinBorder;
    cell.alignment = { vertical: "middle", ...(cell.alignment || {}) };
    if (index % 2 === 1 && !cell.fill) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA_FILL } };
    }
  });
}

function styleTotalRow(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF0F172A" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
    cell.border = {
      ...thinBorder,
      top: { style: "medium", color: { argb: BRAND_RED } },
    };
    cell.alignment = { vertical: "middle", ...(cell.alignment || {}) };
  });
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Super Admin yang dapat mengakses data ini." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const where = buildAdminLogsWhere(searchParams);

    const [logs, withEvidence] = await Promise.all([
      prisma.stepLog.findMany({
        where,
        omit: { evidenceUrl: true },
        include: {
          user: {
            select: { name: true, email: true, department: true, dailyGoal: true },
          },
        },
        orderBy: [{ date: "asc" }, { user: { name: "asc" } }],
      }),
      prisma.stepLog.findMany({
        where: { ...where, evidenceUrl: { not: null } },
        select: { id: true },
      }),
    ]);
    const evidenceIds = new Set(withEvidence.map((l) => l.id));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = user.name || "Walk Rank";
    workbook.created = new Date();

    const generatedAt = new Date(Date.now() + WIB_OFFSET_MS)
      .toISOString()
      .replace("T", " ")
      .slice(0, 16);
    const search = searchParams.get("search")?.trim();
    const infoLines = [
      `Date filter: ${describeDateFilter(searchParams)}`,
      ...(search ? [`Search: "${search}"`] : []),
      `Generated: ${generatedAt} WIB by ${user.name}`,
    ];

    // ---------------------------------------------------------------
    // Sheet 1: Activity Logs (one row per log)
    // ---------------------------------------------------------------
    const logSheet = workbook.addWorksheet("Activity Logs", {
      views: [{ showGridLines: false }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    const logColumns: { header: string; key: string; width: number; numFmt?: string; align?: "left" | "center" | "right" }[] = [
      { header: "No", key: "no", width: 6, align: "center" },
      { header: "Date", key: "date", width: 16, numFmt: "ddd, dd mmm yyyy", align: "center" },
      { header: "Employee Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 30 },
      { header: "Department", key: "department", width: 18 },
      { header: "Actual Steps", key: "steps", width: 13, numFmt: "#,##0", align: "right" },
      { header: "Counted Steps", key: "counted", width: 14, numFmt: "#,##0", align: "right" },
      { header: "Bonus Steps", key: "bonus", width: 12, numFmt: "#,##0", align: "right" },
      { header: "Distance (km)", key: "distance", width: 13, numFmt: "#,##0.00", align: "right" },
      { header: "Calories (kcal)", key: "calories", width: 14, numFmt: "#,##0", align: "right" },
      { header: "Daily Goal", key: "goal", width: 11, numFmt: "#,##0", align: "right" },
      { header: "Target Status", key: "status", width: 16, align: "center" },
      { header: "Photo Evidence", key: "evidence", width: 14, align: "center" },
      { header: "Notes", key: "note", width: 36 },
      { header: "Logged At (WIB)", key: "loggedAt", width: 18, numFmt: "dd mmm yyyy hh:mm", align: "center" },
    ];

    logColumns.forEach((col, i) => {
      logSheet.getColumn(i + 1).width = col.width;
    });

    const logHeaderRowIdx = addTitleBlock(
      logSheet,
      "Walk Rank — Employee Activity Logs",
      infoLines,
      logColumns.length
    );
    const logHeaderRow = logSheet.getRow(logHeaderRowIdx);
    logHeaderRow.values = logColumns.map((c) => c.header);
    styleHeaderRow(logHeaderRow);

    logs.forEach((log, i) => {
      const goal = log.user?.dailyGoal || 8000;
      const isMet = log.stepCount >= goal;
      const row = logSheet.getRow(logHeaderRowIdx + 1 + i);
      row.values = [
        i + 1,
        log.date,
        log.user?.name || "Employee",
        log.user?.email || "",
        log.user?.department || "-",
        log.stepCount,
        Math.min(log.stepCount, DAILY_CAP),
        Math.max(0, log.stepCount - DAILY_CAP),
        log.distanceKm || 0,
        log.calories || 0,
        goal,
        isMet ? "Achieved" : `${(goal - log.stepCount).toLocaleString("en-US")} short`,
        evidenceIds.has(log.id) ? "Yes" : "No",
        log.note || "-",
        new Date(log.createdAt.getTime() + WIB_OFFSET_MS),
      ];

      logColumns.forEach((col, c) => {
        const cell = row.getCell(c + 1);
        if (col.numFmt) cell.numFmt = col.numFmt;
        if (col.align) cell.alignment = { horizontal: col.align };
      });
      row.getCell(14).alignment = { wrapText: true };

      const statusCell = row.getCell(12);
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isMet ? MET_FILL : MISSED_FILL } };
      statusCell.font = { bold: true, color: { argb: isMet ? MET_TEXT : MISSED_TEXT } };

      styleBodyRow(row, i);
    });

    if (logs.length > 0) {
      const first = logHeaderRowIdx + 1;
      const last = logHeaderRowIdx + logs.length;
      const totalRow = logSheet.getRow(last + 1);
      totalRow.getCell(1).value = "TOTAL";
      logSheet.mergeCells(last + 1, 1, last + 1, 5);
      totalRow.getCell(1).alignment = { horizontal: "center" };
      // Columns F..J are summed
      ["F", "G", "H", "I", "J"].forEach((letter, k) => {
        const cell = totalRow.getCell(6 + k);
        cell.value = { formula: `SUM(${letter}${first}:${letter}${last})` };
        cell.numFmt = logColumns[5 + k].numFmt!;
        cell.alignment = { horizontal: "right" };
      });
      const metCell = totalRow.getCell(12);
      metCell.value = { formula: `COUNTIF(L${first}:L${last},"Achieved")&" achieved"` };
      metCell.alignment = { horizontal: "center" };
      styleTotalRow(totalRow);

      logSheet.autoFilter = {
        from: { row: logHeaderRowIdx, column: 1 },
        to: { row: last, column: logColumns.length },
      };
    } else {
      logSheet.mergeCells(logHeaderRowIdx + 1, 1, logHeaderRowIdx + 1, logColumns.length);
      const emptyCell = logSheet.getCell(logHeaderRowIdx + 1, 1);
      emptyCell.value = "No activity logs found for the selected filter.";
      emptyCell.font = { italic: true, color: { argb: "FF64748B" } };
      emptyCell.alignment = { horizontal: "center" };
    }

    logSheet.views = [{ state: "frozen", ySplit: logHeaderRowIdx, xSplit: 3, showGridLines: false }];

    // ---------------------------------------------------------------
    // Sheet 2: Summary per Employee
    // ---------------------------------------------------------------
    const summarySheet = workbook.addWorksheet("Summary per Employee", {
      views: [{ showGridLines: false }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    type Summary = {
      name: string;
      email: string;
      department: string;
      days: number;
      steps: number;
      counted: number;
      bonus: number;
      distance: number;
      calories: number;
      met: number;
      highest: number;
    };
    const byUser = new Map<string, Summary>();
    for (const log of logs) {
      let s = byUser.get(log.userId);
      if (!s) {
        s = {
          name: log.user?.name || "Employee",
          email: log.user?.email || "",
          department: log.user?.department || "-",
          days: 0,
          steps: 0,
          counted: 0,
          bonus: 0,
          distance: 0,
          calories: 0,
          met: 0,
          highest: 0,
        };
        byUser.set(log.userId, s);
      }
      s.days += 1;
      s.steps += log.stepCount;
      s.counted += Math.min(log.stepCount, DAILY_CAP);
      s.bonus += Math.max(0, log.stepCount - DAILY_CAP);
      s.distance += log.distanceKm || 0;
      s.calories += log.calories || 0;
      s.highest = Math.max(s.highest, log.stepCount);
      if (log.stepCount >= (log.user?.dailyGoal || 8000)) s.met += 1;
    }
    const summaries = Array.from(byUser.values()).sort((a, b) => b.counted - a.counted);

    const summaryColumns: { header: string; width: number; numFmt?: string; align?: "left" | "center" | "right" }[] = [
      { header: "Rank", width: 7, align: "center" },
      { header: "Employee Name", width: 26 },
      { header: "Email", width: 30 },
      { header: "Department", width: 18 },
      { header: "Days Logged", width: 12, numFmt: "#,##0", align: "center" },
      { header: "Total Actual Steps", width: 17, numFmt: "#,##0", align: "right" },
      { header: "Total Counted Steps", width: 18, numFmt: "#,##0", align: "right" },
      { header: "Total Bonus Steps", width: 16, numFmt: "#,##0", align: "right" },
      { header: "Avg Counted / Day", width: 17, numFmt: "#,##0", align: "right" },
      { header: "Highest Day", width: 13, numFmt: "#,##0", align: "right" },
      { header: "Distance (km)", width: 14, numFmt: "#,##0.00", align: "right" },
      { header: "Calories (kcal)", width: 15, numFmt: "#,##0", align: "right" },
      { header: "Targets Achieved", width: 16, numFmt: "#,##0", align: "center" },
    ];
    summaryColumns.forEach((col, i) => {
      summarySheet.getColumn(i + 1).width = col.width;
    });

    const sumHeaderRowIdx = addTitleBlock(
      summarySheet,
      "Walk Rank — Summary per Employee",
      infoLines,
      summaryColumns.length
    );
    const sumHeaderRow = summarySheet.getRow(sumHeaderRowIdx);
    sumHeaderRow.values = summaryColumns.map((c) => c.header);
    styleHeaderRow(sumHeaderRow);

    summaries.forEach((s, i) => {
      const row = summarySheet.getRow(sumHeaderRowIdx + 1 + i);
      row.values = [
        i + 1,
        s.name,
        s.email,
        s.department,
        s.days,
        s.steps,
        s.counted,
        s.bonus,
        s.days > 0 ? Math.round(s.counted / s.days) : 0,
        s.highest,
        Number(s.distance.toFixed(2)),
        s.calories,
        s.met,
      ];
      summaryColumns.forEach((col, c) => {
        const cell = row.getCell(c + 1);
        if (col.numFmt) cell.numFmt = col.numFmt;
        if (col.align) cell.alignment = { horizontal: col.align };
      });
      if (i < 3) row.getCell(1).font = { bold: true, color: { argb: BRAND_RED } };
      styleBodyRow(row, i);
    });

    if (summaries.length > 0) {
      const first = sumHeaderRowIdx + 1;
      const last = sumHeaderRowIdx + summaries.length;
      const totalRow = summarySheet.getRow(last + 1);
      totalRow.getCell(1).value = "TOTAL";
      summarySheet.mergeCells(last + 1, 1, last + 1, 4);
      totalRow.getCell(1).alignment = { horizontal: "center" };
      ["E", "F", "G", "H", null, null, "K", "L", "M"].forEach((letter, k) => {
        const col = summaryColumns[4 + k];
        const cell = totalRow.getCell(5 + k);
        if (letter) cell.value = { formula: `SUM(${letter}${first}:${letter}${last})` };
        if (col.numFmt) cell.numFmt = col.numFmt;
        if (col.align) cell.alignment = { horizontal: col.align };
      });
      styleTotalRow(totalRow);

      summarySheet.autoFilter = {
        from: { row: sumHeaderRowIdx, column: 1 },
        to: { row: last, column: summaryColumns.length },
      };
    }

    summarySheet.views = [{ state: "frozen", ySplit: sumHeaderRowIdx, xSplit: 2, showGridLines: false }];

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Walk_Rank_Activity_Logs_${fileSuffix(searchParams)}.xlsx`;

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Admin Logs export error:", error);
    return NextResponse.json(
      { error: "Gagal mengekspor log aktivitas ke Excel." },
      { status: 500 }
    );
  }
}
