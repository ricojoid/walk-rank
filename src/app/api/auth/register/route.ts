import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, getAuthCookieName } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { name, username, email, password, department } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = (username || email.split("@")[0])
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9._-]/g, "");

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanUsername },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Username is already taken. Please choose another username." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        role: Role.USER,
        department: department?.trim() || "General",
        dailyGoal: 8000,
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      },
    });

    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      dailyGoal: newUser.dailyGoal,
      avatarUrl: newUser.avatarUrl,
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
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat registrasi." },
      { status: 500 }
    );
  }
}
