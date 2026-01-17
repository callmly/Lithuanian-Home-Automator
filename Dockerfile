# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=5000

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy drizzle config for migrations
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/shared ./shared

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

# Start command
CMD ["node", "dist/index.js"]
