# Multi-stage Dockerfile for cosmetics.lk IT Infrastructure Portal
# Optimized for Next.js 16 Standalone Production Build

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

# --- Stage 1: Install Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# --- Stage 2: Build Application ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# --- Stage 3: Production Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Colombo

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets and pre-created uploads dir
COPY --from=builder /app/public ./public
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

# Copy data directory for persistent database.json
COPY --from=builder /app/src/data ./src/data
RUN chown -R nextjs:nodejs /app/src/data

# Copy Next.js standalone server and static chunks
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/stats || exit 1

CMD ["node", "server.js"]
