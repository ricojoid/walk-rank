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
    const period = searchParams.get("period") || "today"; // "today", "7d", "30d", "custom", "specific"
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const datesParam = searchParams.get("dates");

    const today = new Date();
    const todayDateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    let isSpecificDates = false;
    let selectedDateStrings: string[] = [];
    let selectedDateObjs: Date[] = [];
    let startDate: Date = todayDateOnly;
    let endDate: Date = todayDateOnly;
    let diffDays = 1;

    if (datesParam && datesParam.trim().length > 0) {
      selectedDateStrings = Array.from(
        new Set(
          datesParam
            .split(",")
            .map((s) => s.trim())
            .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
        )
      ).sort();

      if (selectedDateStrings.length > 0) {
        isSpecificDates = true;
        selectedDateObjs = selectedDateStrings.map((dStr) => {
          const [y, m, d] = dStr.split("-").map(Number);
          return new Date(Date.UTC(y, m - 1, d));
        });
        diffDays = Math.max(1, selectedDateObjs.length);
        startDate = selectedDateObjs[0];
        endDate = selectedDateObjs[selectedDateObjs.length - 1];
      }
    }

    if (!isSpecificDates) {
      if (startDateParam && endDateParam) {
        const [sy, sm, sd] = startDateParam.split("-").map(Number);
        startDate = new Date(Date.UTC(sy, sm - 1, sd));
        const [ey, em, ed] = endDateParam.split("-").map(Number);
        endDate = new Date(Date.UTC(ey, em - 1, ed));
      } else if (period === "7d") {
        startDate = new Date(todayDateOnly.getTime() - 6 * 86400000);
        endDate = todayDateOnly;
      } else if (period === "30d") {
        startDate = new Date(todayDateOnly.getTime() - 29 * 86400000);
        endDate = todayDateOnly;
      } else if (period === "month") {
        startDate = new Date(Date.UTC(todayDateOnly.getUTCFullYear(), todayDateOnly.getUTCMonth(), 1));
        endDate = todayDateOnly;
      } else {
        startDate = todayDateOnly;
        endDate = todayDateOnly;
      }
      diffDays = Math.max(
        1,
        Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1
      );
    }

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        dailyGoal: true,
        avatarUrl: true,
      },
    });

    const logs = await prisma.stepLog.findMany({
      where: isSpecificDates
        ? {
            date: {
              in: selectedDateObjs,
            },
          }
        : {
            date: {
              gte: startDate,
              lte: endDate,
            },
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

    for (const log of logs) {
      const stat = userStatsMap.get(log.userId);
      if (stat) {
        stat.totalActualSteps += log.stepCount;
        stat.totalDistance += log.distanceKm;
        stat.totalCalories += log.calories;
        stat.daysLogged += 1;
        stat.highestDaySteps = Math.max(stat.highestDaySteps, log.stepCount);

        // Bobot 30% konsistensi: target minimal 8000 steps per hari
        if (log.stepCount >= 8000) {
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
        const goalRate =
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
          goalCompletionRate: goalRate,
          consistencyRate: goalRate,
          isCurrentUser: item.user.id === user.id,
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

    return NextResponse.json({
      period,
      totalDays: diffDays,
      dateRange: {
        mode: isSpecificDates ? "specific_dates" : "range",
        isSpecificDates,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        totalDays: diffDays,
        selectedDates: isSpecificDates ? selectedDateStrings : undefined,
      },
      leaderboard,
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
