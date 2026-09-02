import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Hanya Super Admin yang dapat mengakses analitik ini." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const today = new Date();
    const todayDateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const yesterdayDateOnly = new Date(todayDateOnly.getTime() - 86400000);

    // Default range: last 7 days if not provided
    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      const s = new Date(startDateParam);
      const e = new Date(endDateParam);
      startDate = new Date(Date.UTC(s.getFullYear(), s.getMonth(), s.getDate()));
      endDate = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate()));
    } else {
      endDate = todayDateOnly;
      startDate = new Date(todayDateOnly.getTime() - 6 * 86400000); // 7 days inclusive
    }

    // 1. Fetch Today & Yesterday Total Steps for KPI cards
    const todayLogs = await prisma.stepLog.findMany({
      where: { date: todayDateOnly },
      include: { user: { select: { id: true, name: true, avatarUrl: true, department: true } } },
    });

    const yesterdayLogs = await prisma.stepLog.findMany({
      where: { date: yesterdayDateOnly },
    });

    const totalStepsToday = todayLogs.reduce((acc, l) => acc + l.stepCount, 0);
    const activeUsersToday = todayLogs.length;
    const totalStepsYesterday = yesterdayLogs.reduce((acc, l) => acc + l.stepCount, 0);
    const activeUsersYesterday = yesterdayLogs.length;

    // Top user today
    const topUserToday = todayLogs.length > 0
      ? [...todayLogs].sort((a, b) => b.stepCount - a.stepCount)[0]
      : null;

    // Total registered users
    const totalUsersCount = await prisma.user.count();

    // 2. Fetch all logs in the selected Date Range
    const rangeLogs = await prisma.stepLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            dailyGoal: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    const totalStepsRange = rangeLogs.reduce((acc, l) => acc + l.stepCount, 0);
    const totalDistanceRange = Number((totalStepsRange * 0.00076).toFixed(2));
    const totalCaloriesRange = Math.round(totalStepsRange * 0.042);

    // Calculate number of days in range
    const diffDays = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1
    );

    // 3. Build Daily Time Series for charts
    const dailyMap = new Map<
      string,
      { date: string; displayDate: string; totalSteps: number; activeUsers: number; logs: any[] }
    >();

    // Pre-populate all days in range so chart is continuous
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(startDate.getTime() + i * 86400000);
      const key = d.toISOString().split("T")[0];
      const displayDate = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      dailyMap.set(key, {
        date: key,
        displayDate,
        totalSteps: 0,
        activeUsers: 0,
        logs: [],
      });
    }

    for (const log of rangeLogs) {
      const key = new Date(log.date).toISOString().split("T")[0];
      if (dailyMap.has(key)) {
        const entry = dailyMap.get(key)!;
        entry.totalSteps += log.stepCount;
        entry.activeUsers += 1;
        entry.logs.push(log);
      }
    }

    const timeSeriesData = Array.from(dailyMap.values()).map((item) => ({
      date: item.date,
      displayDate: item.displayDate,
      totalSteps: item.totalSteps,
      activeUsers: item.activeUsers,
      avgStepsPerActiveUser:
        item.activeUsers > 0 ? Math.round(item.totalSteps / item.activeUsers) : 0,
    }));

    // 4. Build User Leaderboard for selected Date Range
    const allUsers = await prisma.user.findMany({
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

    const userStatsMap = new Map<
      string,
      {
        user: any;
        score: number;
        totalCountedSteps: number;
        totalExcessSteps: number;
        totalActualSteps: number;
        totalDistance: number;
        totalCalories: number;
        daysLogged: number;
        highestDaySteps: number;
        goalsMetCount: number;
      }
    >();

    // Initialize map
    for (const u of allUsers) {
      userStatsMap.set(u.id, {
        user: u,
        score: 0,
        totalCountedSteps: 0,
        totalExcessSteps: 0,
        totalActualSteps: 0,
        totalDistance: 0,
        totalCalories: 0,
        daysLogged: 0,
        highestDaySteps: 0,
        goalsMetCount: 0,
      });
    }

    for (const log of rangeLogs) {
      const stat = userStatsMap.get(log.userId);
      if (stat) {
        stat.totalActualSteps += log.stepCount;
        stat.totalDistance += log.distanceKm;
        stat.totalCalories += log.calories;
        stat.daysLogged += 1;
        stat.highestDaySteps = Math.max(stat.highestDaySteps, log.stepCount);

        // Daily goal: 8000 steps = 1 score point
        const goalThreshold = stat.user.dailyGoal || 8000;
        if (log.stepCount >= goalThreshold) {
          stat.score += 1;
          stat.goalsMetCount += 1;
        }

        // Daily cap: max 10000 steps counted per day
        const counted = Math.min(log.stepCount, 10000);
        const excess = Math.max(0, log.stepCount - 10000);
        stat.totalCountedSteps += counted;
        stat.totalExcessSteps += excess;
      }
    }

    // Find the highest accumulated counted steps among all participants in this date range
    const allStats = Array.from(userStatsMap.values());
    const highestAccumulatedCountedSteps = Math.max(
      ...allStats.map((s) => s.totalCountedSteps),
      0
    );

    const leaderboard = allStats
      .map((item) => {
        const avgSteps = item.daysLogged > 0 ? Math.round(item.totalCountedSteps / item.daysLogged) : 0;
        const goalCompletionRate =
          diffDays > 0 ? Math.round((item.goalsMetCount / diffDays) * 100) : 0;

        // Bobot 70%: (total step akumulasi sendiri / total step terbanyak di rentang tanggal) * 70
        const stepScore =
          highestAccumulatedCountedSteps > 0
            ? Number(((item.totalCountedSteps / highestAccumulatedCountedSteps) * 70).toFixed(2))
            : 0;

        // Bobot 30%: Konsistensi mencapai target harian terhadap jumlah hari rentang tanggal
        const consistencyScore =
          diffDays > 0
            ? Math.min(30, Number(((item.goalsMetCount / diffDays) * 30).toFixed(2)))
            : 0;

        // Final Score: 0 - 100
        const finalScore = Number((stepScore + consistencyScore).toFixed(2));

        return {
          userId: item.user.id,
          name: item.user.name,
          email: item.user.email,
          role: item.user.role,
          department: item.user.department || "General",
          avatarUrl: item.user.avatarUrl,
          dailyGoal: item.user.dailyGoal || 8000,
          score: finalScore,
          finalScore,
          stepScore,
          consistencyScore,
          goalsMetCount: item.goalsMetCount,
          targetAchievedDays: item.goalsMetCount,
          totalDaysInRange: diffDays,
          maxCountedSteps: highestAccumulatedCountedSteps,
          totalCountedSteps: item.totalCountedSteps,
          countedSteps: item.totalCountedSteps,
          totalExcessSteps: item.totalExcessSteps,
          totalSteps: item.totalCountedSteps,
          totalActualSteps: item.totalActualSteps,
          totalDistanceKm: Number(item.totalDistance.toFixed(2)),
          totalCalories: item.totalCalories,
          daysLogged: item.daysLogged,
          avgSteps,
          highestDaySteps: item.highestDaySteps,
          goalCompletionRate,
          consistencyRate: goalCompletionRate,
        };
      })
      .sort((a, b) => {
        // 1. Primary: Final Score (70% steps + 30% consistency)
        if (b.finalScore !== a.finalScore) {
          return b.finalScore - a.finalScore;
        }
        // 2. Secondary: Counted steps (capped 10k/day)
        if (b.totalCountedSteps !== a.totalCountedSteps) {
          return b.totalCountedSteps - a.totalCountedSteps;
        }
        // 3. Tertiary: Target met days
        if (b.goalsMetCount !== a.goalsMetCount) {
          return b.goalsMetCount - a.goalsMetCount;
        }
        // 4. Quaternary: Actual steps
        return b.totalActualSteps - a.totalActualSteps;
      })
      .map((entry, idx) => ({
        rank: idx + 1,
        ...entry,
      }));

    // 5. Department Breakdown
    const deptMap = new Map<string, { totalSteps: number; userIds: Set<string> }>();
    for (const item of leaderboard) {
      const dept = item.department;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { totalSteps: 0, userIds: new Set() });
      }
      const dEntry = deptMap.get(dept)!;
      dEntry.totalSteps += item.totalSteps;
      dEntry.userIds.add(item.userId);
    }

    const departmentStats = Array.from(deptMap.entries())
      .map(([dept, data]) => ({
        department: dept,
        totalSteps: data.totalSteps,
        userCount: data.userIds.size,
        avgStepsPerUser: data.userIds.size > 0 ? Math.round(data.totalSteps / data.userIds.size) : 0,
      }))
      .sort((a, b) => b.totalSteps - a.totalSteps);

    return NextResponse.json({
      dateRange: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        totalDays: diffDays,
      },
      kpi: {
        today: {
          totalSteps: totalStepsToday,
          activeUsers: activeUsersToday,
          totalUsers: totalUsersCount,
          activePercentage:
            totalUsersCount > 0 ? Math.round((activeUsersToday / totalUsersCount) * 100) : 0,
          avgSteps: activeUsersToday > 0 ? Math.round(totalStepsToday / activeUsersToday) : 0,
          topWalker: topUserToday
            ? {
                name: topUserToday.user.name,
                steps: topUserToday.stepCount,
                avatarUrl: topUserToday.user.avatarUrl,
                department: topUserToday.user.department,
              }
            : null,
        },
        yesterday: {
          totalSteps: totalStepsYesterday,
          activeUsers: activeUsersYesterday,
        },
        range: {
          totalSteps: totalStepsRange,
          totalDistanceKm: totalDistanceRange,
          totalCalories: totalCaloriesRange,
          avgStepsPerDay: Math.round(totalStepsRange / diffDays),
          uniqueWalkersCount: leaderboard.filter((u) => u.totalSteps > 0).length,
          totalUsers: totalUsersCount,
        },
      },
      timeSeriesData,
      leaderboard,
      departmentStats,
    });
  } catch (error) {
    console.error("Super Admin Analytics Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses data analitik Super Admin." },
      { status: 500 }
    );
  }
}
