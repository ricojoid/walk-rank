import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, getAuthCookieName } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { identifier, email, password } = await req.json();

    const loginIdentifier = (identifier || email || "").toLowerCase().trim();

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: "Username/Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { username: loginIdentifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username/email or password." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username/email or password." },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      username: user.username,
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
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat login." },
      { status: 500 }
    );
  }
}
