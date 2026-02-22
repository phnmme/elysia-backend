import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class statisticsGuestService {
  async getDashboardStats() {
    try {
      const [graduates, coop] = await Promise.all([
        prisma.studentProfile.groupBy({
          by: ["gradYear"],
          where: {
            gradYear: { not: null },
          },
          _count: { id: true },
        }),

        prisma.studentProfile.groupBy({
          by: ["gradYear"],
          where: {
            gradYear: { not: null },
            continued_from_coop: true,
          },
          _count: { id: true },
        }),
      ]);

      const coopMap = new Map(coop.map((c) => [c.gradYear, c._count.id]));

      const graduateChart = graduates
        .map((g) => ({
          year: g.gradYear!,
          graduates: g._count.id,
          coopEmployed: coopMap.get(g.gradYear) || 0,
        }))
        .sort((a, b) => a.year - b.year);

      const sectorData = await prisma.studentProfile.groupBy({
        by: ["gradYear", "employment_sector"],
        where: {
          gradYear: { not: null },
          employment_sector: { not: null },
        },
        _count: { id: true },
      });

      const sectorMap = new Map<
        number,
        { year: number; private: number; government: number }
      >();

      for (const row of sectorData) {
        const year = row.gradYear!;
        if (!sectorMap.has(year)) {
          sectorMap.set(year, {
            year,
            private: 0,
            government: 0,
          });
        }

        const item = sectorMap.get(year)!;

        if (row.employment_sector === "PRIVATE") {
          item.private = row._count.id;
        } else if (row.employment_sector === "GOVERNMENT") {
          item.government = row._count.id;
        }
      }

      const employmentSectorChart = Array.from(sectorMap.values()).sort(
        (a, b) => a.year - b.year
      );

      return {
        message: "ดึงข้อมูลสถิติสำเร็จ",
        data: {
          coopChart: graduateChart,
          employmentSectorChart: employmentSectorChart,
        },
      };
    } catch (error) {
      console.error("Dashboard stats error:", error);
      throw new Error("Failed to load dashboard statistics");
    }
  }
}
