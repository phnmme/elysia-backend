// src/api/v1/user/user.service.ts

import { Context } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "../../shared/auth.helper";

const prisma = new PrismaClient();

// สร้าง temp password แบบ random
function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export class userService {
  // GET /api/v1/user/users?search=&role=&hasProfile=&page=&limit=
  // ดึงรายชื่อ user ทั้งหมด (เฉพาะ Admin)
  async getUsers(
    query: {
      search?: string;
      role?: string;
      hasProfile?: string;
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
        { email: { contains: query.search, mode: "insensitive" } },
        {
          profile: {
            OR: [
              { firstNameTh: { contains: query.search, mode: "insensitive" } },
              { lastNameTh: { contains: query.search, mode: "insensitive" } },
              { studentCode: { contains: query.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (query.role && query.role !== "all") {
      where.role = query.role.toUpperCase();
    }

    if (query.hasProfile === "with") {
      where.profile = { isNot: null };
    } else if (query.hasProfile === "without") {
      where.profile = { is: null };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              id: true,
              studentCode: true,
              firstNameTh: true,
              lastNameTh: true,
              phoneNumber: true,
              department: true,
              entryYear: true,
              gradYear: true,
              jobField: true,
              continued_from_coop: true,
              employment_sector: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      message: "รายชื่อผู้ใช้งาน",
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // GET /api/v1/user/users/:id
  // ดูข้อมูล user รายบุคคล
  async getUserById(
    id: number,
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAdmin(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        _count: {
          select: { logs: true, careerReviews: true },
        },
      },
    });

    if (!user) {
      set.status = 404;
      return { message: "ไม่พบผู้ใช้" };
    }

    return { message: "ข้อมูลผู้ใช้", data: user };
  }

  // DELETE /api/v1/user/users/:id
  // ลบ user (เฉพาะ Admin/Owner ลบ User ได้, Owner ลบ Admin ได้)
  async deleteUser(
    id: number,
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAdmin(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const caller = await prisma.user.findUnique({ where: { id: decoded.id } });
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) {
      set.status = 404;
      return { message: "ไม่พบผู้ใช้" };
    }

    if (target.id === decoded.id) {
      set.status = 400;
      return { message: "ไม่สามารถลบบัญชีตัวเองได้" };
    }

    if (target.role === "OWNER") {
      set.status = 403;
      return { message: "ไม่สามารถลบบัญชี OWNER ได้" };
    }

    if (target.role === "ADMIN" && caller?.role !== "OWNER") {
      set.status = 403;
      return { message: "เฉพาะ OWNER เท่านั้นที่สามารถลบ Admin ได้" };
    }

    await prisma.user.delete({ where: { id } });

    await prisma.log.create({
      data: {
        action: "USER_DELETED",
        details: `ลบบัญชีผู้ใช้ ${target.email} (ID #${id})`,
        userId: decoded.id,
      },
    });

    return { message: "ลบผู้ใช้สำเร็จ" };
  }

  // POST /api/v1/user/users/:id/reset-password
  // สร้าง Temp Password และ hash เก็บลง DB (Admin เท่านั้น)
  async resetPassword(
    id: number,
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAdmin(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      set.status = 404;
      return { message: "ไม่พบผู้ใช้" };
    }

    if (target.role === "OWNER") {
      set.status = 403;
      return { message: "ไม่สามารถรีเซ็ตรหัสผ่านของ OWNER ได้" };
    }

    const tempPassword = generateTempPassword();

    // Hash password ด้วย Bun built-in (หรือใช้ bcrypt ถ้าต้องการ)
    const hashed = await Bun.password.hash(tempPassword, {
      algorithm: "bcrypt",
      cost: 10,
    });

    await prisma.user.update({
      where: { id },
      data: { password: hashed },
    });

    await prisma.log.create({
      data: {
        action: "PASSWORD_RESET",
        details: `รีเซ็ตรหัสผ่านของ ${target.email} โดย Admin`,
        userId: decoded.id,
      },
    });

    return {
      message: "รีเซ็ตรหัสผ่านสำเร็จ",
      data: {
        tempPassword, // ส่งให้ Admin copy ไปแจ้ง user
        expiresIn: "24h", // แนะนำให้ user เปลี่ยนรหัสใหม่ทันที
        userId: id,
        email: target.email,
      },
    };
  }
}
