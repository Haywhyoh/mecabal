# Multi-stage Dockerfile for MeCabal NestJS Backend
# Single monolith application

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

# Build the monolith application
RUN npx nest build monolith

# Stage 4: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Install curl for health checks and dumb-init for proper signal handling
RUN apk add --no-cache curl dumb-init

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

# Install production dependencies and migration tools
RUN npm ci --production && \
    npm install typeorm ts-node tsconfig-paths dotenv @types/node typescript && \
    npm cache clean --force

# Create logs directory
RUN mkdir -p logs && chown -R nestjs:nodejs /app

USER nestjs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/monolith/apps/monolith/src/main.js"]
