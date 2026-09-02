import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "walkrank_default_secret_key_2026";
const COOKIE_NAME = "walkrank_auth_token";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  dailyGoal: number;
  avatarUrl?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      dailyGoal: user.dailyGoal,
      avatarUrl: user.avatarUrl,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || !payload.id) return null;

    // Fetch fresh user from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        dailyGoal: true,
        avatarUrl: true,
      },
    });

    return dbUser;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

export function getAuthCookieName(): string {
  return COOKIE_NAME;
}
