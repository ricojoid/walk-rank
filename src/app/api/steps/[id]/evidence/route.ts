import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const log = await prisma.stepLog.findUnique({
      where: { id },
      select: { userId: true, evidenceUrl: true },
    });

    if (!log || !log.evidenceUrl) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    // Only owner or SUPER_ADMIN can view evidence
    if (log.userId !== user.id && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const match = log.evidenceUrl.match(/^data:([^;,]+)(;base64)?,(.*)$/s);
    if (!match) {
      // Stored as a plain URL — let the browser fetch it directly
      return NextResponse.redirect(new URL(log.evidenceUrl, req.url));
    }

    const [, contentType, isBase64, payload] = match;
    const body = isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload));

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(body.length),
        // URL is versioned by updatedAt (?v=), so it is safe to cache long-term
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error fetching evidence:", error);
    return NextResponse.json({ error: "Failed to load evidence" }, { status: 500 });
  }
}
