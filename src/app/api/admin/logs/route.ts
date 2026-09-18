import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
    const search = searchParams.get("search")?.trim() || "";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const datesParam = searchParams.get("dates");
    const userIdParam = searchParams.get("userId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));

    const where: any = {};

    // Date filters
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
        where.date = { in: selectedDateObjs };
      }
    } else if (startDateParam || endDateParam) {
      const dateFilter: any = {};
      if (startDateParam) {
        const s = new Date(startDateParam);
        dateFilter.gte = new Date(Date.UTC(s.getFullYear(), s.getMonth(), s.getDate()));
      }
      if (endDateParam) {
        const e = new Date(endDateParam);
        dateFilter.lte = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate()));
      }
      where.date = dateFilter;
    }

    // User filter
    if (userIdParam) {
      where.userId = userIdParam;
    }

    // Search filter across user name or email
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { department: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [totalCount, logs] = await Promise.all([
      prisma.stepLog.count({ where }),
      prisma.stepLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              avatarUrl: true,
              role: true,
              dailyGoal: true,
            },
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      logs,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    });
  } catch (error) {
    console.error("Admin Logs API error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat catatan log aktivitas." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let logId = searchParams.get("id");

    if (!logId) {
      try {
        const body = await req.json();
        logId = body.id;
      } catch (e) {
        // ignore
      }
    }

    if (!logId) {
      return NextResponse.json({ error: "Activity log ID is required" }, { status: 400 });
    }

    const existing = await prisma.stepLog.findUnique({
      where: { id: logId },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Activity log not found" }, { status: 404 });
    }

    await prisma.stepLog.delete({
      where: { id: logId },
    });

    return NextResponse.json({
      success: true,
      message: `Activity log for ${existing.user?.name || "employee"} (${existing.stepCount} steps) deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting log in admin route:", error);
    return NextResponse.json({ error: "Failed to delete activity log." }, { status: 500 });
  }
}
