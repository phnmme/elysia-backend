//src\api\v1\auth\authorized\auth.authorized.service.ts

import { Context } from "elysia";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class authAuthorizedService {
  async getMe(jwt: any, set: Context["set"], headers: Context["headers"]) {
    const auth = headers["authorization"];
    if (!auth) {
      set.status = 401;
      return {
        message: "ไม่มีสิทธิ์เข้าถึง",
      };
    }

    const token = auth.split(" ")[1];
    try {
      const decoded = await jwt.verify(token);
      if (!decoded || typeof decoded === "string") {
        set.status = 401;
        return {
          message: "โทเค็นไม่ถูกต้อง",
        };
      }
      return {
        message: "ข้อมูลผู้ใช้",
        data: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        },
      };
    } catch (error) {
      set.status = 401;
      return {
        message: "โทเค็นไม่ถูกต้อง",
      };
    }
  }
  async verifyToken(
    page: string,
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    if (page !== "admin" && page !== "user") {
      set.status = 400;
      return { message: "ไม่มีสิทธิ์เข้าถึงหน้าที่ระบุ" };
    }

    const auth = headers["authorization"];
    if (!auth || !auth.startsWith("Bearer ")) {
      set.status = 401;
      return { message: "ไม่มีสิทธิ์เข้าถึง" };
    }

    const token = auth.split(" ")[1];

    try {
      const decoded = (await jwt.verify(token)) as {
        id: number;
        email: string;
        name: string;
        role: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        set.status = 401;
        return { message: "ผู้ใช้ไม่ถูกต้อง", page };
      }

      if (page === "admin" && !["ADMIN", "OWNER"].includes(user.role)) {
        set.status = 403;
        return { message: "ไม่มีสิทธิ์เข้าถึงหน้าผู้ดูแลระบบ" };
      }

      return {
        message: "โทเค็นถูกต้อง",
        user,
      };
    } catch {
      set.status = 401;
      return { message: "โทเค็นไม่ถูกต้อง", page };
    }
  }
}
