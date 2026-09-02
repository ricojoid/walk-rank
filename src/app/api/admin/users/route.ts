import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        department: true,
        dailyGoal: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: { stepLogs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, username, email, password, role, dailyGoal } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = (username || email.split("@")[0])
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9._-]/g, "");

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { username: cleanUsername },
        ],
      },
    });

    if (existing) {
      if (existing.email === cleanEmail) {
        return NextResponse.json(
          { error: "An employee with this email already exists." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const assignedRole: Role = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "USER";
    const goal = parseInt(dailyGoal, 10) > 0 ? parseInt(dailyGoal, 10) : 8000;

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        role: assignedRole,
        dailyGoal: goal,
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        dailyGoal: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, name, username, role, dailyGoal, department } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name && typeof name === "string") {
      updateData.name = name.trim();
    }
    if (username && typeof username === "string") {
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
      if (cleanUsername.length >= 3) {
        const existing = await prisma.user.findFirst({
          where: {
            username: cleanUsername,
            NOT: { id: userId },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: "Username is already taken by another employee." },
            { status: 409 }
          );
        }
        updateData.username = cleanUsername;
      }
    }
    if (role && (role === "USER" || role === "SUPER_ADMIN")) {
      updateData.role = role as Role;
    }
    if (dailyGoal && Number(dailyGoal) > 0) {
      updateData.dailyGoal = Number(dailyGoal);
    }
    if (department !== undefined) {
      updateData.department = department;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own Super Admin account." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cascade delete stepLogs and user
    await prisma.$transaction([
      prisma.stepLog.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} and their activity logs have been permanently deleted.`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
