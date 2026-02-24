// src/api/v1/review/review.controller.ts

import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { reviewService } from "./reviews.authorized.service";

const service = new reviewService();

export const reviewController = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "your-secret-key",
    })
  )
  .group("/api/v1/review/authorized", (app) => {
    // GET /api/v1/review/reviews?status=&search=&jobField=&page=1&limit=20
    app.get("/reviews", ({ jwt, set, headers, query }) =>
      service.getReviews(query, jwt, set, headers)
    );

    // GET /api/v1/review/reviews/jobfields — สำหรับ dropdown filter
    app.get("/reviews/jobfields", ({ jwt, set, headers }) =>
      service.getJobFields(jwt, set, headers)
    );

    // GET /api/v1/review/reviews/:id
    app.get("/reviews/:id", ({ jwt, set, headers, params }) =>
      service.getReviewById(Number(params.id), jwt, set, headers)
    );

    // POST /api/v1/review/reviews — สร้าง review ใหม่
    app.post(
      "/reviews",
      ({ jwt, set, headers, body }) =>
        service.createReview(
          body as { title: string; description: string; jobField?: string },
          jwt,
          set,
          headers
        ),
      {
        body: t.Object({
          title: t.String(),
          description: t.String(),
          jobField: t.Optional(t.String()),
        }),
      }
    );

    // PATCH /api/v1/review/reviews/:id/status — Admin อนุมัติ/ปฏิเสธ
    app.patch(
      "/reviews/:id/status",
      ({ jwt, set, headers, params, body }) =>
        service.updateReviewStatus(
          Number(params.id),
          body as { status: "pending" | "approved" | "rejected" },
          jwt,
          set,
          headers
        ),
      {
        body: t.Object({
          status: t.Union([
            t.Literal("pending"),
            t.Literal("approved"),
            t.Literal("rejected"),
          ]),
        }),
      }
    );

    // DELETE /api/v1/review/reviews/:id
    app.delete("/reviews/:id", ({ jwt, set, headers, params }) =>
      service.deleteReview(Number(params.id), jwt, set, headers)
    );

    return app;
  });
