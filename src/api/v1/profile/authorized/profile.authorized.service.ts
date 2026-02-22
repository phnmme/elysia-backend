import { Context } from "elysia";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class profileAuthorizedService {
  async getProfile(jwt: any, set: Context["set"], headers: Context["headers"]) {
    const auth = headers["authorization"];
    if (!auth) {
      set.status = 401;
      return { message: "ไม่มีสิทธิ์เข้าถึง" };
    }

    const token = auth.split(" ")[1];
    try {
      const decoded = await jwt.verify(token);
      // console.log("Decoded Token:", decoded);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          profile: true,
        },
      });

      return {
        message: "ข้อมูลโปรไฟล์",
        data: {
          user,
        },
      };
    } catch (error) {
      set.status = 401;
      return { message: "โทเค็นไม่ถูกต้อง" };
    }
  }
  async updateProfile(
    body: {
      fullname?: string;
      studentCode?: string;
      gradYear?: number;
      jobField?: string;
    },
    jwt: any,
    set: Context["set"],
    headers: Context["headers"]
  ) {
    const auth = headers["authorization"];
    if (!auth) {
      set.status = 401;
      return { message: "ไม่มีสิทธิ์เข้าถึง" };
    }

    const token = auth.split(" ")[1];
    const parts = body.fullname?.trim().split(/\s+/) || [];

    const first = parts[0];
    const last = parts[1];

    try {
      const decoded = await jwt.verify(token);

      const updatedProfile = await prisma.studentProfile.update({
        where: { userId: decoded.id },
        data: {
          firstNameTh: first || undefined,
          lastNameTh: last || undefined,
          studentCode: body.studentCode || undefined,
          gradYear: body.gradYear || undefined,
          jobField: body.jobField || undefined,
        },
      });

      return {
        message: "อัปเดตโปรไฟล์สำเร็จ",
      };
    } catch (error) {
      set.status = 401;
      return { message: "โทเค็นไม่ถูกต้อง" };
    }
  }
}
