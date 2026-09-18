import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

    // Retrieve target user profile
    const targetUser =
      targetUserId === user.id
        ? user
        : await prisma.user.findUnique({
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

    const logs = await prisma.stepLog.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: limitParam ? parseInt(limitParam, 10) : 60,
    });

    // Compute stats
    const today = new Date();
    const todayDateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    const todayLog = await prisma.stepLog.findFirst({
      where: {
        userId: targetUserId,
        date: todayDateOnly,
      },
    });

    const allUserLogs = await prisma.stepLog.findMany({
      where: { userId: targetUserId },
      orderBy: { date: "desc" },
    });

    const totalSteps = allUserLogs.reduce((acc, l) => acc + l.stepCount, 0);
    const totalDistance = allUserLogs.reduce((acc, l) => acc + l.distanceKm, 0);
    const totalCalories = allUserLogs.reduce((acc, l) => acc + l.calories, 0);
    const logDaysCount = allUserLogs.length;
    const avgSteps = logDaysCount > 0 ? Math.round(totalSteps / logDaysCount) : 0;
    const maxSteps = allUserLogs.reduce((max, l) => Math.max(max, l.stepCount), 0);

    // Calculate streak (consecutive days with logged steps >= 1)
    let streak = 0;
    const sortedDesc = [...allUserLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedDesc.length > 0) {
      let expectedDate = new Date(todayDateOnly);
      // check if today is logged, if not check from yesterday
      const firstLogDate = new Date(sortedDesc[0].date);
      const isTodayLogged = firstLogDate.getTime() === expectedDate.getTime();
      
      let curr = isTodayLogged ? expectedDate : new Date(todayDateOnly.getTime() - 86400000);
      
      for (const log of sortedDesc) {
        const logD = new Date(log.date);
        if (logD.toISOString().split("T")[0] === curr.toISOString().split("T")[0]) {
          streak++;
          curr = new Date(curr.getTime() - 86400000);
        } else if (logD.getTime() < curr.getTime()) {
          break;
        }
      }
    }

    // Mini daily leaderboard for motivation
    const todayCommunityLogs = await prisma.stepLog.findMany({
      where: { date: todayDateOnly },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, department: true, dailyGoal: true },
        },
      },
      orderBy: { stepCount: "desc" },
      take: 5,
    });

    return NextResponse.json({
      user: targetUser,
      logs,
      today: todayLog || {
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

    const { date, stepCount, note, evidenceUrl } = await req.json();

    if (!date || stepCount === undefined || stepCount < 0) {
      return NextResponse.json(
        { error: "Date and step count (min. 0) are required." },
        { status: 400 }
      );
    }

    // Parse date into pure Date (UTC YYYY-MM-DD)
    const rawDate = new Date(date);
    const cleanDate = new Date(
      Date.UTC(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate())
    );

    const steps = Math.max(0, parseInt(stepCount, 10) || 0);
    const distanceKm = Number((steps * 0.00076).toFixed(2));
    const calories = Math.round(steps * 0.042);

    // Enforce mandatory photo evidence when recording steps
    if (steps > 0 && (!evidenceUrl || typeof evidenceUrl !== "string" || evidenceUrl.trim().length === 0)) {
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
        evidenceUrl: evidenceUrl ? evidenceUrl.trim() : null,
        note: note ? note.trim() : null,
      },
      create: {
        userId: user.id,
        date: cleanDate,
        stepCount: steps,
        distanceKm,
        calories,
        evidenceUrl: evidenceUrl ? evidenceUrl.trim() : null,
        note: note ? note.trim() : null,
      },
    });

    return NextResponse.json({ success: true, log: stepLog });
  } catch (error) {
    console.error("Error saving step log:", error);
    return NextResponse.json({ error: "Failed to save step log." }, { status: 500 });
  }
}
