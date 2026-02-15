import { Elysia } from "elysia";
import { studentsGuestService } from "./students.guest.service";

const service = new studentsGuestService();

export const studentsGuestController = new Elysia().group(
  "/api/v1/students/guest",
  (app) => {
    app.get("/getallyear", () => service.getAllYear());
    app.get("/getstudentbyyear", ({ query }) =>
      service.getStudentByYear(
        query.year === "all" ? "all" : parseInt(query.year),
        parseInt(query.skip) || 0
      )
    );
    return app;
  }
);
