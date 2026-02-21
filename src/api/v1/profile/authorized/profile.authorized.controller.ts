import { Elysia, t } from "elysia";
import { profileAuthorizedService } from "./profile.authorized.service";
import { jwt } from "@elysiajs/jwt";

const service = new profileAuthorizedService();

export const profileAuthorizedController = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "your-secret-key",
    })
  )
  .group("/api/v1/profile/authorized", (app) => {
    app.get("/getprofile", async ({ set, headers, jwt }) => {
      return await service.getProfile(jwt, set, headers);
    });
    app.put(
      "/updateprofile",
      async ({ body, set, headers, jwt }) => {
        return await service.updateProfile(body, jwt, set, headers);
      },
      {
        body: t.Object({
          fullname: t.Optional(t.String()),
          studentCode: t.Optional(t.String()),
          gradYear: t.Optional(t.Number()),
          jobField: t.Optional(t.String()),
          continued_from_coop: t.Optional(t.Boolean()),
          employment_sector: t.Optional(
            t.Enum({ PRIVATE: "PRIVATE", GOVERNMENT: "GOVERNMENT" })
          ),
        }),
      }
    );
    return app;
  });
