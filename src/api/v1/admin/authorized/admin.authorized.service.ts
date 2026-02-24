// src/api/v1/admin/admin.service.ts

import { Context } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "../../shared/auth.helper";

const prisma = new PrismaClient();

export class adminService {
  // GET /api/v1/admin/admins
  // ดึงรายชื่อ Admin และ Owner ทั้งหมด
  async getAdmins(jwt: any, set: Context["set"], headers: Context["headers"]) {
    const decoded = await requireAdmin(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "OWNER"] } },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            firstNameTh: true,
            lastNameTh: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // ดึง login log ล่าสุดของแต่ละ admin แบบ batch (query เดียว ไม่ loop)
    const adminIds = admins.map((a) => a.id);

    const latestLoginLogs = await prisma.log.findMany({
      where: {
        action: "LOGIN",
        userId: { in: adminIds },
      },
      select: {
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      distinct: ["userId"],
    });

    // สร้าง map userId -> lastLoginAt เพื่อ lookup O(1)
    const loginMap = new Map<number, Date>();
    for (const log of latestLoginLogs) {
      if (log.userId !== null) {
        loginMap.set(log.userId, log.createdAt);
      }
    }

    const ONE_HOUR_MS = 60 * 60 * 1000;
    const now = Date.now();

    const data = admins.map((admin) => {
      const lastLoginAt = loginMap.get(admin.id) ?? null;
      const isOnline = lastLoginAt
        ? now - lastLoginAt.getTime() <= ONE_HOUR_MS
        : false;

      return {
        ...admin,
        lastLoginAt, // เวลา login ล่าสุด (null ถ้ายังไม่เคย login)
        isOnline, // true ถ้า login ภายใน 1 ชม.
      };
    });

    return {
      message: "รายชื่อผู้ดูแลระบบ",
      data,
    };
  }

  // POST /api/v1/admin/admins
  // เพิ่ม Admin ใหม่ (เปลี่ยน role ของ USER ที่มีอยู่ให้เป็น ADMIN)
  async createAdmin(
    body: { email: string },
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAdmin(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    // OWNER เท่านั้นที่เพิ่ม admin ได้
    const caller = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!caller || caller.role !== "OWNER") {
      set.status = 403;
      return { message: "เฉพาะ OWNER เท่านั้นที่สามารถเพิ่ม Admin ได้" };
    }

    if (!body.email) {
      set.status = 400;
      return { message: "กรุณาระบุอีเมล" };
    }

    const target = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!target) {
      set.status = 404;
      return { message: "ไม่พบผู้ใช้ที่มีอีเมลนี้" };
    }

    if (target.role === "ADMIN" || target.role === "OWNER") {
      set.status = 409;
      return { message: "ผู้ใช้นี้เป็น Admin อยู่แล้ว" };
    }

    const updated = await prisma.user.update({
      where: { email: body.email },
      data: { role: "ADMIN" },
      select: { id: true, email: true, role: true },
    });

    // Log
    await prisma.log.create({
      data: {
        action: "ADMIN_CREATED",
        details: `เปลี่ยน role ของ ${body.email} เป็น ADMIN`,
        userId: decoded.id,
      },
    });

    return { message: "เพิ่ม Admin สำเร็จ", data: updated };
  }

  // DELETE /api/v1/admin/admins/:id
  // ถอด Admin กลับเป็น USER
  async deleteAdmin(
    id: number,
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAdmin(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    // OWNER เท่านั้น
    const caller = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!caller || caller.role !== "OWNER") {
      set.status = 403;
      return { message: "เฉพาะ OWNER เท่านั้นที่สามารถถอดสิทธิ์ Admin ได้" };
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      set.status = 404;
      return { message: "ไม่พบผู้ใช้" };
    }

    if (target.role === "OWNER") {
      set.status = 403;
      return { message: "ไม่สามารถถอดสิทธิ์ OWNER ได้" };
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: "USER" },
      select: { id: true, email: true, role: true },
    });

    await prisma.log.create({
      data: {
        action: "ADMIN_REMOVED",
        details: `ถอดสิทธิ์ Admin ของ ${target.email}`,
        userId: decoded.id,
      },
    });

    return { message: "ถอดสิทธิ์ Admin สำเร็จ", data: updated };
  }
}
