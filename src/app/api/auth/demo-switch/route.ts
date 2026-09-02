import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, getAuthCookieName } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { role, email } = await req.json();

    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else if (role === "SUPER_ADMIN") {
      user = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    } else {
      user = await prisma.user.findFirst({ where: { role: "USER" } });
    }

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      dailyGoal: user.dailyGoal,
      avatarUrl: user.avatarUrl,
    };

    const token = signToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    response.cookies.set({
      name: getAuthCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Demo switch error:", error);
    return NextResponse.json({ error: "Gagal mengganti akun demo" }, { status: 500 });
  }
}
