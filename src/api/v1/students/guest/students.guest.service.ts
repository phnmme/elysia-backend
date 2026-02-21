import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class studentsGuestService {
  async getAllYear() {
    const years = await prisma.studentProfile.findMany({
      select: {
        gradYear: true,
      },
      where: {
        gradYear: {
          not: null,
        },
      },
      distinct: ["gradYear"],
      orderBy: {
        gradYear: "desc",
      },
    });

    if (years.length === 0) {
      return {
        message: "ไม่พบข้อมูลปีการศึกษา",
      };
    }
    return {
      message: "ดึงข้อมูลปีการศึกษาสำเร็จ",
      data: {
        years: years.map((y) => y.gradYear),
      },
    };
  }
  async getStudentByYear(year: number | "all", skip = 0, limit = 10) {
    // =========================
    // CASE: year = all
    // =========================
    if (year === "all") {
      const years = await prisma.studentProfile.findMany({
        select: { gradYear: true },
        where: { gradYear: { not: null } },
        distinct: ["gradYear"],
        orderBy: { gradYear: "asc" },
      });

      const gradYears = years.map((y) => y.gradYear!);

      const counts = await prisma.studentProfile.groupBy({
        by: ["gradYear"],
        _count: {
          gradYear: true,
        },
      });

      const countMap = counts.reduce((acc, item) => {
        acc[item.gradYear!] = item._count.gradYear;
        return acc;
      }, {} as Record<number, number>);

      const result = await Promise.all(
        gradYears.map(async (y) => {
          const students = await prisma.studentProfile.findMany({
            where: { gradYear: y },
            take: 10,
            orderBy: { updatedAt: "desc" },
          });

          return {
            gradYear: y,
            count: countMap[y] || 0,
            students,
          };
        })
      );

      return result;
    }

    // =========================
    // CASE: year = specific
    // =========================

    // นับทั้งหมดของปีนั้น
    const total = await prisma.studentProfile.count({
      where: { gradYear: year },
    });

    const students = await prisma.studentProfile.findMany({
      where: {
        gradYear: year,
      },
      skip,
      take: limit,
      orderBy: { id: "asc" },
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
        userId: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return {
      message: "ดึงข้อมูลนักศึกษาปีการศึกษาสำเร็จ",
      data: {
        gradYear: year,
        total, // จำนวนทั้งหมด
        students,
        nextSkip: skip + students.length,
        hasMore: skip + students.length < total,
      },
    };
  }
}
