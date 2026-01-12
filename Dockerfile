# =========================
# Build stage
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL deps (needed for build & prisma)
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client (Prisma 7 compatible)
RUN npx prisma generate

# Build NestJS app
RUN npm run build


# =========================
# Runtime stage
# =========================
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production deps
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma client artifacts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy Prisma schema & config
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Copy entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose API port
EXPOSE 3000

# ❌ HEALTHCHECK REMOVED (Coolify-friendly)

ENTRYPOINT ["/docker-entrypoint.sh"]
