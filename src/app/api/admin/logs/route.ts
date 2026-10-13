import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { attachEvidenceLinks } from "@/lib/evidence";
import { buildAdminLogsWhere } from "@/lib/logFilters";

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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));

    const where = buildAdminLogsWhere(searchParams);

    const [totalCount, logs] = await Promise.all([
      prisma.stepLog.count({ where }),
      prisma.stepLog.findMany({
        where,
        omit: { evidenceUrl: true },
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
      logs: await attachEvidenceLinks(logs),
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
