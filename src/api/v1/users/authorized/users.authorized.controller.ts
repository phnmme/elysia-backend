// src/api/v1/user/user.controller.ts

import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { userService } from "./users.authorized.service";

const service = new userService();

export const userController = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "your-secret-key",
    })
  )
  .group("/api/v1/user/authorized", (app) => {
    // GET /api/v1/user/users?search=&role=&hasProfile=&page=1&limit=20
    app.get("/users", ({ jwt, set, headers, query }) =>
      service.getUsers(query, jwt, set, headers)
    );

    // GET /api/v1/user/users/:id
    app.get("/users/:id", ({ jwt, set, headers, params }) =>
      service.getUserById(Number(params.id), jwt, set, headers)
    );

    // DELETE /api/v1/user/users/:id
    app.delete("/users/:id", ({ jwt, set, headers, params }) =>
      service.deleteUser(Number(params.id), jwt, set, headers)
    );

    // POST /api/v1/user/users/:id/reset-password
    app.post("/users/:id/reset-password", ({ jwt, set, headers, params }) =>
      service.resetPassword(Number(params.id), jwt, set, headers)
    );

    return app;
  });
