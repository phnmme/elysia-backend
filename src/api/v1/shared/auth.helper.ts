// src/api/v1/shared/auth.helper.ts

import { Context } from "elysia";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type DecodedToken = {
  id: number;
  email: string;
  role: string;
};

/**
 * ตรวจสอบ JWT และดึง user จาก DB
 * คืน decoded token หรือ set status แล้ว return error object
 */
export async function requireAuth(
  jwt: any,
  set: Context["set"],
  headers: Context["headers"]
): Promise<DecodedToken | null> {
  const auth = headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    set.status = 401;
    return null;
  }

  const token = auth.split(" ")[1];

  try {
    const decoded = (await jwt.verify(token)) as DecodedToken;
    if (!decoded || !decoded.id) {
      set.status = 401;
      return null;
    }
    return decoded;
  } catch {
    set.status = 401;
    return null;
  }
}

/**
 * ตรวจสอบว่า user เป็น ADMIN หรือ OWNER
 */
export async function requireAdmin(
  jwt: any,
  set: Context["set"],
  headers: Context["headers"]
): Promise<DecodedToken | null> {
  const decoded = await requireAuth(jwt, set, headers);
  if (!decoded) return null;

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    set.status = 401;
    return null;
  }

  if (user.role !== "ADMIN" && user.role !== "OWNER") {
    set.status = 403;
    return null;
  }

  return decoded;
}
