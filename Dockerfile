# ---------- Builder ----------
FROM oven/bun:latest AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

FROM oven/bun:latest AS production
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 4000

CMD ["sh", "-c", "bunx prisma generate && bunx prisma migrate deploy && bun run src/index.ts"]