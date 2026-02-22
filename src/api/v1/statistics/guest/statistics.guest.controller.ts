import { Elysia } from "elysia";
import { statisticsGuestService } from "./statistics.guest.service";

const service = new statisticsGuestService();

export const statisticsGuestController = new Elysia().group(
  "/api/v1/statistics/guest",
  (app) => {
    app.get("/getStats", () => service.getDashboardStats());
    return app;
  }
);
