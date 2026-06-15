# --- deps ---
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- builder ---
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate butuh DATABASE_URL terdefinisi, tapi nggak perlu koneksi nyata saat build
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

# NEXT_PUBLIC_* di-bake saat build time — harus di-set di build stage, bukan runtime
ARG NEXT_PUBLIC_SCRAPER_API_URL
ENV NEXT_PUBLIC_SCRAPER_API_URL=$NEXT_PUBLIC_SCRAPER_API_URL
RUN npm run build

# --- runner ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# node_modules lengkap (termasuk Prisma CLI devDependency) + schema/seed,
# supaya `docker exec catalyst_scout npx prisma db push` / seed bisa jalan
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "server.js"]
