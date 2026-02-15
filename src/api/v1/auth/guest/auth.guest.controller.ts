import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { AuthGuestService } from "./auth.guest.service";

const service = new AuthGuestService();

export const authGuestController = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "your-secret-key",
    })
  )
  .group("/api/v1/auth/guest", (app) => {
    app.post("/login", ({ body, jwt, set }) => service.login(body, jwt, set), {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    });
    app.post("/register", ({ body, set }) => service.register(body, set), {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        confirmPassword: t.String(),
        studentCode: t.String(),
        firstNameTh: t.String(),
        lastNameTh: t.String(),
        phoneNumber: t.String(),
        entryYear: t.Number(),
      }),
    });

    return app;
  });
