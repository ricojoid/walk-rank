import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { stepCount, note } = await req.json();

    const existing = await prisma.stepLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Data log tidak ditemukan" }, { status: 404 });
    }

    // Only owner or SUPER_ADMIN can edit
    if (existing.userId !== user.id && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const steps = Math.max(0, parseInt(stepCount, 10) || 0);
    const distanceKm = Number((steps * 0.00076).toFixed(2));
    const calories = Math.round(steps * 0.042);

    const updated = await prisma.stepLog.update({
      where: { id },
      data: {
        stepCount: steps,
        distanceKm,
        calories,
        note: note !== undefined ? (note ? note.trim() : null) : existing.note,
      },
    });

    return NextResponse.json({ success: true, log: updated });
  } catch (error) {
    console.error("Error updating step log:", error);
    return NextResponse.json({ error: "Gagal memperbarui data" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.stepLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Data log tidak ditemukan" }, { status: 404 });
    }

    if (existing.userId !== user.id && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    await prisma.stepLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Log berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting step log:", error);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}
