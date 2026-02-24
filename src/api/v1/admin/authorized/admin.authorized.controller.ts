// src/api/v1/admin/admin.controller.ts

import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { adminService } from "./admin.authorized.service";

const service = new adminService();

export const adminController = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "your-secret-key",
    })
  )
  .group("/api/v1/admin/authorized", (app) => {
    app.get("/admins", ({ jwt, set, headers }) =>
      service.getAdmins(jwt, set, headers)
    );

    // POST /api/v1/admin/admins — เพิ่ม Admin (ระบุ email ของ user ที่มีอยู่)
    app.post(
      "/admins",
      ({ jwt, set, headers, body }) =>
        service.createAdmin(body as { email: string }, jwt, set, headers),
      {
        body: t.Object({ email: t.String() }),
      }
    );

    // DELETE /api/v1/admin/admins/:id — ถอด Admin กลับเป็น USER
    app.delete("/admins/:id", ({ jwt, set, headers, params }) =>
      service.deleteAdmin(Number(params.id), jwt, set, headers)
    );

    return app;
  });
