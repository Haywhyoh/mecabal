# Multi-stage Dockerfile for MeCabal NestJS Backend

# Stage 1: Base
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# Stage 3: Builder
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build all applications and libraries
RUN npx nest build api-gateway && \
    npx nest build auth-service && \
    npx nest build user-service && \
    npx nest build social-service && \
    npx nest build messaging-service && \
    npx nest build marketplace-service && \
    npx nest build events-service && \
    npx nest build notification-service && \
    npx nest build location-service && \
    npx nest build business-service

# Stage 4: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Copy TypeORM configuration and migrations for database operations
COPY --from=builder /app/ormconfig.ts ./ormconfig.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/libs/database/src/migrations ./libs/database/src/migrations
COPY --from=builder /app/libs/database/src/entities ./libs/database/src/entities
COPY --from=builder /app/libs/database/src/seeds ./libs/database/src/seeds
COPY --from=builder /app/scripts ./scripts

# Install production dependencies and dev dependencies needed for migrations
RUN npm ci --production && npm install typeorm ts-node tsconfig-paths dotenv @types/node typescript

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