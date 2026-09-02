import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const whereClause: any = {};
    if (startDateParam && endDateParam) {
      const s = new Date(startDateParam);
      const e = new Date(endDateParam);
      whereClause.date = {
        gte: new Date(Date.UTC(s.getFullYear(), s.getMonth(), s.getDate())),
        lte: new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate())),
      };
    }

    const logs = await prisma.stepLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            department: true,
            dailyGoal: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { stepCount: "desc" }],
    });

    // Generate CSV string
    const headers = [
      "Date",
      "Employee Name",
      "Email",
      "Actual Steps",
      "Counted Steps (Max 10k)",
      "Excess Steps",
      "Daily Goal (8k)",
      "Goal Status",
      "Score Point",
      "Est Distance (km)",
      "Est Calories (kcal)",
      "Notes",
    ];

    const rows = logs.map((log) => {
      const dateStr = new Date(log.date).toISOString().split("T")[0];
      const goal = log.user.dailyGoal || 8000;
      const isTargetMet = log.stepCount >= goal;
      const targetStatus = isTargetMet ? "ACHIEVED" : "MISSED";
      const scorePoint = isTargetMet ? 1 : 0;
      const countedSteps = Math.min(log.stepCount, 10000);
      const excessSteps = Math.max(0, log.stepCount - 10000);
      const cleanNote = (log.note || "").replace(/"/g, '""');

      return [
        `"${dateStr}"`,
        `"${log.user.name}"`,
        `"${log.user.email}"`,
        log.stepCount,
        countedSteps,
        excessSteps,
        goal,
        `"${targetStatus}"`,
        scorePoint,
        log.distanceKm,
        log.calories,
        `"${cleanNote}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="walkrank-report-${startDateParam || "all"}-to-${endDateParam || "all"}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
