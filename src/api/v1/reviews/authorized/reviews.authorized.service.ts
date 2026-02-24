// src/api/v1/review/review.service.ts

import { Context } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requireAdmin, requireAuth } from "../../shared/auth.helper";

const prisma = new PrismaClient();

export class reviewService {
  // GET /api/v1/review/reviews?status=&search=&jobField=&page=&limit=
  // ดึง review ทั้งหมด (Admin ดูได้ทุก review, User ดูได้เฉพาะของตัวเอง)
  async getReviews(
    query: {
      status?: string;
      search?: string;
      jobField?: string;
      page?: string;
      limit?: string;
    },
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAuth(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const caller = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!caller) {
      set.status = 401;
      return { message: "ไม่พบผู้ใช้" };
    }

    const isAdmin = caller.role === "ADMIN" || caller.role === "OWNER";
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};

    // User ธรรมดาเห็นเฉพาะของตัวเอง
    if (!isAdmin) {
      where.userId = decoded.id;
    }

    if (query.status && query.status !== "all") {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { jobField: { contains: query.search, mode: "insensitive" } },
        {
          user: {
            profile: {
              OR: [
                {
                  firstNameTh: { contains: query.search, mode: "insensitive" },
                },
                { lastNameTh: { contains: query.search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    if (query.jobField && query.jobField !== "all") {
      where.jobField = { equals: query.jobField, mode: "insensitive" };
    }

    const [total, reviews] = await Promise.all([
      prisma.careerReview.count({ where }),
      prisma.careerReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: {
                select: {
                  firstNameTh: true,
                  lastNameTh: true,
                  studentCode: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      message: "รายการ Career Review",
      data: reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // GET /api/v1/review/reviews/:id
  async getReviewById(
    id: number,
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAuth(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const review = await prisma.careerReview.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                firstNameTh: true,
                lastNameTh: true,
                studentCode: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      set.status = 404;
      return { message: "ไม่พบ Review" };
    }

    const caller = await prisma.user.findUnique({ where: { id: decoded.id } });
    const isAdmin = caller?.role === "ADMIN" || caller?.role === "OWNER";

    if (!isAdmin && review.userId !== decoded.id) {
      set.status = 403;
      return { message: "ไม่มีสิทธิ์เข้าถึง Review นี้" };
    }

    return { message: "ข้อมูล Review", data: review };
  }

  // POST /api/v1/review/reviews
  // สร้าง review ใหม่ (User ทั่วไป)
  async createReview(
    body: { title: string; description: string; jobField?: string },
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAuth(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    if (!body.title || !body.description) {
      set.status = 400;
      return { message: "กรุณากรอก title และ description" };
    }

    const review = await prisma.careerReview.create({
      data: {
        title: body.title,
        description: body.description,
        jobField: body.jobField,
        userId: decoded.id,
      },
    });

    await prisma.log.create({
      data: {
        action: "REVIEW_CREATED",
        details: `สร้าง Review: "${body.title}"`,
        userId: decoded.id,
      },
    });

    return { message: "สร้าง Review สำเร็จ", data: review };
  }

  // PATCH /api/v1/review/reviews/:id/status
  // อนุมัติ / ปฏิเสธ review (เฉพาะ Admin)
  // หมายเหตุ: CareerReview schema ไม่มี status field โดยตรง
  // ถ้าต้องการ status ให้เพิ่ม field `status String @default("pending")` ใน schema
  // เส้นนี้แสดง pattern การ update พร้อม log
  async updateReviewStatus(
    id: number,
    body: { status: "pending" | "approved" | "rejected" },
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAdmin(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(body.status)) {
      set.status = 400;
      return { message: "Status ไม่ถูกต้อง" };
    }

    const review = await prisma.careerReview.findUnique({ where: { id } });
    if (!review) {
      set.status = 404;
      return { message: "ไม่พบ Review" };
    }

    // อัปเดต (ต้องเพิ่ม status field ใน Prisma schema ก่อน)
    const updated = await prisma.careerReview.update({
      where: { id },
      data: { status: body.status },
    });

    await prisma.log.create({
      data: {
        action: `REVIEW_${body.status.toUpperCase()}`,
        details: `${
          body.status === "approved" ? "อนุมัติ" : "ปฏิเสธ"
        } Review ID #${id}: "${review.title}"`,
        userId: decoded.id,
      },
    });

    return {
      message: `${
        body.status === "approved" ? "อนุมัติ" : "ปฏิเสธ"
      } Review สำเร็จ`,
      data: updated,
    };
  }

  // DELETE /api/v1/review/reviews/:id
  // ลบ review (Admin ลบได้ทุกอัน, User ลบได้เฉพาะของตัวเอง)
  async deleteReview(
    id: number,
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAuth(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const review = await prisma.careerReview.findUnique({ where: { id } });
    if (!review) {
      set.status = 404;
      return { message: "ไม่พบ Review" };
    }

    const caller = await prisma.user.findUnique({ where: { id: decoded.id } });
    const isAdmin = caller?.role === "ADMIN" || caller?.role === "OWNER";

    if (!isAdmin && review.userId !== decoded.id) {
      set.status = 403;
      return { message: "ไม่มีสิทธิ์ลบ Review นี้" };
    }

    await prisma.careerReview.delete({ where: { id } });

    await prisma.log.create({
      data: {
        action: "REVIEW_DELETED",
        details: `ลบ Review ID #${id}: "${review.title}"`,
        userId: decoded.id,
      },
    });

    return { message: "ลบ Review สำเร็จ" };
  }

  // GET /api/v1/review/reviews/jobfields
  // ดึง jobField ที่มีทั้งหมดสำหรับ filter dropdown
  async getJobFields(
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const decoded = await requireAuth(jwt, set, headers);
    if (!decoded) return { message: "ไม่มีสิทธิ์เข้าถึง" };

    const fields = await prisma.careerReview.findMany({
      where: { jobField: { not: null } },
      select: { jobField: true },
      distinct: ["jobField"],
      orderBy: { jobField: "asc" },
    });

    return {
      message: "รายชื่อสายงาน",
      data: fields.map((f) => f.jobField).filter(Boolean),
    };
  }
}
