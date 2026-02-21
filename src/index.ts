import { Elysia } from "elysia";
import { authGuestController } from "./api/v1/auth/guest/auth.guest.controller";
import { authAuthorizedController } from "./api/v1/auth/authorized/auth.authorized.controller";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { studentsGuestController } from "./api/v1/students/guest/students.guest.controller";
import { profileAuthorizedController } from "./api/v1/profile/authorized/profile.authorized.controller";

const app = new Elysia()
  .use(
    cors({
      origin: [
        "https://website-kmutnb-1n4c.vercel.app",
        "http://localhost:3000",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
  .use(swagger())
  .use(authGuestController)
  .use(authAuthorizedController)
  .use(studentsGuestController)
  .use(profileAuthorizedController)
  .get("/", () => "Hello Elysia!")
  .listen(4000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
