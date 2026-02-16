# Use official Bun image
FROM oven/bun:1

WORKDIR /app

# Copy dependency files ก่อน (เพื่อ cache)
COPY bun.lockb package.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy project files
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

ENV NODE_ENV=production

EXPOSE 4000

# Run app (Elysia entry)
CMD ["bun", "run", "src/index.ts"]
