import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { attachEvidenceLinks, resolveEvidenceInput } from "@/lib/evidence";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const limitParam = searchParams.get("limit");
    const userIdParam = searchParams.get("userId");
    const datesParam = searchParams.get("dates");

    // Super admin can inspect other users' steps
    const targetUserId =
      user.role === "SUPER_ADMIN" && userIdParam ? userIdParam : user.id;

    // Resolve target user profile without blocking subsequent queries
    const targetUserPromise: Promise<any> =
      targetUserId === user.id
        ? Promise.resolve(user)
        : prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              department: true,
              dailyGoal: true,
              avatarUrl: true,
            },
          });

    const dateFilter: any = {};
    if (startDateParam) {
      dateFilter.gte = new Date(startDateParam);
    }
    if (endDateParam) {
      dateFilter.lte = new Date(endDateParam);
    }

    const whereClause: any = { userId: targetUserId };
    if (datesParam && datesParam.trim().length > 0) {
      const selectedDateStrings = Array.from(
        new Set(
          datesParam
            .split(",")
            .map((s) => s.trim())
            .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
        )
      );
      if (selectedDateStrings.length > 0) {
        const selectedDateObjs = selectedDateStrings.map((dStr) => {
          const [y, m, d] = dStr.split("-").map(Number);
          return new Date(Date.UTC(y, m - 1, d));
        });
        whereClause.date = { in: selectedDateObjs };
      }
    } else if (startDateParam || endDateParam) {
      whereClause.date = dateFilter;
    }

    const today = new Date();
    const todayDateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    // Run all DB queries in parallel — avoids sequential round-trips
    const [targetUser, logs, todayLog, statsAgg, datesForStreak, todayCommunityLogs] = await Promise.all([
      targetUserPromise,
      // Evidence photos are Base64 blobs — omit them and send links instead (see attachEvidenceLinks)
      prisma.stepLog.findMany({
        where: whereClause,
        omit: { evidenceUrl: true },
        orderBy: { date: "desc" },
        take: limitParam ? parseInt(limitParam, 10) : 60,
      }),
      prisma.stepLog.findFirst({
        where: { userId: targetUserId, date: todayDateOnly },
        omit: { evidenceUrl: true },
      }),
      // Aggregate avoids loading all rows just to compute sums
      prisma.stepLog.aggregate({
        where: { userId: targetUserId },
        _sum: { stepCount: true, distanceKm: true, calories: true },
        _count: { id: true },
        _max: { stepCount: true },
      }),
      // Only fetch dates for streak — minimal data transfer
      prisma.stepLog.findMany({
        where: { userId: targetUserId },
        select: { date: true },
        orderBy: { date: "desc" },
      }),
      prisma.stepLog.findMany({
        where: { date: todayDateOnly },
        select: {
          id: true,
          stepCount: true,
          user: {
            select: { id: true, name: true, avatarUrl: true, department: true, dailyGoal: true },
          },
        },
        orderBy: { stepCount: "desc" },
        take: 5,
      }),
    ]);

    const [logsWithEvidence, [todayWithEvidence]] = await Promise.all([
      attachEvidenceLinks(logs),
      attachEvidenceLinks(todayLog ? [todayLog] : []),
    ]);

    const totalSteps = statsAgg._sum.stepCount ?? 0;
    const totalDistance = statsAgg._sum.distanceKm ?? 0;
    const totalCalories = statsAgg._sum.calories ?? 0;
    const logDaysCount = statsAgg._count.id;
    const avgSteps = logDaysCount > 0 ? Math.round(totalSteps / logDaysCount) : 0;
    const maxSteps = statsAgg._max.stepCount ?? 0;

    // Streak: datesForStreak is already sorted desc by DB — no JS sort needed
    let streak = 0;
    if (datesForStreak.length > 0) {
      const firstLogDateStr = new Date(datesForStreak[0].date).toISOString().split("T")[0];
      const isTodayLogged = firstLogDateStr === todayDateOnly.toISOString().split("T")[0];
      let curr = isTodayLogged ? new Date(todayDateOnly) : new Date(todayDateOnly.getTime() - 86400000);

      for (const entry of datesForStreak) {
        const logD = new Date(entry.date);
        if (logD.toISOString().split("T")[0] === curr.toISOString().split("T")[0]) {
          streak++;
          curr = new Date(curr.getTime() - 86400000);
        } else if (logD.getTime() < curr.getTime()) {
          break;
        }
      }
    }

    return NextResponse.json({
      user: targetUser,
      logs: logsWithEvidence,
      today: todayWithEvidence || {
        date: todayDateOnly,
        stepCount: 0,
        distanceKm: 0,
        calories: 0,
        note: null,
      },
      stats: {
        totalSteps,
        totalDistance: Number(totalDistance.toFixed(2)),
        totalCalories,
        avgSteps,
        maxSteps,
        logDaysCount,
        streak,
        dailyGoal: targetUser?.dailyGoal || user.dailyGoal || 8000,
      },
      miniLeaderboard: todayCommunityLogs.map((item, index) => ({
        rank: index + 1,
        userId: item.user.id,
        name: item.user.name,
        department: item.user.department,
        avatarUrl: item.user.avatarUrl,
        stepCount: item.stepCount,
        isCurrentUser: item.user.id === user.id,
      })),
    });
  } catch (error) {
    console.error("Error fetching step logs:", error);
    return NextResponse.json({ error: "Failed to fetch step logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, stepCount, note, evidenceUrl: evidenceInput } = await req.json();
    const evidenceUrl = await resolveEvidenceInput(evidenceInput, user);

    if (!date || stepCount === undefined || stepCount < 0) {
      return NextResponse.json(
        { error: "Date and step count (min. 0) are required." },
        { status: 400 }
      );
    }

    // Parse date into pure Date (UTC YYYY-MM-DD)
    let cleanDate: Date;
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      const [y, m, d] = date.trim().split("-").map(Number);
      cleanDate = new Date(Date.UTC(y, m - 1, d));
    } else {
      const rawDate = new Date(date);
      cleanDate = new Date(
        Date.UTC(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate())
      );
    }

    const steps = Math.max(0, parseInt(stepCount, 10) || 0);
    const distanceKm = Number((steps * 0.00076).toFixed(2));
    const calories = Math.round(steps * 0.042);

    // Enforce mandatory photo evidence when recording steps
    if (steps > 0 && !evidenceUrl) {
      return NextResponse.json(
        { error: "Photo evidence is required! Please attach a photo/screenshot of your step tracker or pedometer." },
        { status: 400 }
      );
    }

    const stepLog = await prisma.stepLog.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: cleanDate,
        },
      },
      update: {
        stepCount: steps,
        distanceKm,
        calories,
        evidenceUrl,
        note: note ? note.trim() : null,
      },
      create: {
        userId: user.id,
        date: cleanDate,
        stepCount: steps,
        distanceKm,
        calories,
        evidenceUrl,
        note: note ? note.trim() : null,
      },
      omit: { evidenceUrl: true },
    });

    const [log] = await attachEvidenceLinks([stepLog]);
    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Error saving step log:", error);
    return NextResponse.json({ error: "Failed to save step log." }, { status: 500 });
  }
}
