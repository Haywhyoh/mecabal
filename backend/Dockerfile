# Multi-stage Dockerfile for MeCabal NestJS Backend

# Stage 1: Base
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm for better performance
RUN npm install -g pnpm

# Stage 2: Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --production=false

# Stage 3: Builder
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build all applications and libraries
RUN pnpm run build

# Stage 4: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install production dependencies
RUN pnpm install --frozen-lockfile --production=true

# Change ownership
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/apps/api-gateway/main.js --health || exit 1

# Default command (can be overridden)
CMD ["node", "dist/apps/api-gateway/main.js"]