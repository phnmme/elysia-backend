// src/api/v1/log/log.service.ts

import { Context } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "../../shared/auth.helper";

const prisma = new PrismaClient();

export class logService {
  // GET /api/v1/log/logs?search=&action=&userId=&page=&limit=
  // ดึง log ทั้งหมด (เฉพาะ Admin/Owner)
  async getLogs(
    query: {
      search?: string;
      action?: string;
      userId?: string;
      page?: string;
      limit?: string;
    },
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAdmin(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: "insensitive" } },
        { details: { contains: query.search, mode: "insensitive" } },
        {
          user: {
            email: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }

    if (query.action) {
      where.action = { equals: query.action, mode: "insensitive" };
    }

    if (query.userId) {
      where.userId = Number(query.userId);
    }

    const [total, logs] = await Promise.all([
      prisma.log.count({ where }),
      prisma.log.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      message: "รายการ Log",
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // GET /api/v1/log/logs/actions
  // ดึงรายชื่อ action ที่มีทั้งหมด (สำหรับ filter dropdown)
  async getLogActions(
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAdmin(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const actions = await prisma.log.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    });

    return {
      message: "รายชื่อ Action",
      data: actions.map((a) => a.action),
    };
  }

  // DELETE /api/v1/log/logs/:id
  // ลบ log รายการเดียว (เฉพาะ OWNER)
  async deleteLog(
    id: number,
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAdmin(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const caller = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!caller || caller.role !== "OWNER") {
      set.status = 403;
      return { message: "เฉพาะ OWNER เท่านั้นที่สามารถลบ Log ได้" };
    }

    const log = await prisma.log.findUnique({ where: { id } });
    if (!log) {
      set.status = 404;
      return { message: "ไม่พบ Log" };
    }

    await prisma.log.delete({ where: { id } });
    return { message: "ลบ Log สำเร็จ" };
  }
}
