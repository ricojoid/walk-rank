import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, comparePassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
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
      },
    });

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, username, avatarUrl, currentPassword, newPassword } = await req.json();

    const updateData: any = {};

    if (name && typeof name === "string" && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    if (username && typeof username === "string") {
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, "");
      if (cleanUsername.length < 3) {
        return NextResponse.json(
          { error: "Username must be at least 3 characters." },
          { status: 400 }
        );
      }

      // Check if another user already has this username
      const existing = await prisma.user.findFirst({
        where: {
          username: cleanUsername,
          NOT: { id: user.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "This username is already taken by another employee." },
          { status: 409 }
        );
      }

      updateData.username = cleanUsername;
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    // Handle password update if requested
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!fullUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (currentPassword) {
        const isMatch = await comparePassword(currentPassword, fullUser.password);
        if (!isMatch) {
          return NextResponse.json(
            { error: "Current password is incorrect." },
            { status: 400 }
          );
        }
      }

      updateData.password = await hashPassword(newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
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
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: updated,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
