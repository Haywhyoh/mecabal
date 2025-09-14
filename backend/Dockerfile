# Multi-stage Dockerfile for MeCabal NestJS Backend

# Stage 1: Base
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production=false

# Stage 3: Builder
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build all applications and libraries
RUN npm run build

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install production dependencies
RUN npm ci --only=production=true

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