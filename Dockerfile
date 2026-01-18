# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Verify build output
RUN ls -la dist/ && ls -la dist/public/ && echo "Build successful!"

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=5000

# Copy package files
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Install drizzle-kit globally for migrations (with all dependencies)
RUN npm install -g drizzle-kit drizzle-orm pg tsx

# Copy built application (server + client)
COPY --from=builder /app/dist ./dist

# Copy drizzle config (CommonJS - no imports needed) and schema for migrations
COPY --from=builder /app/drizzle.config.prod.cjs ./drizzle.config.cjs
COPY --from=builder /app/shared ./shared

# Copy scripts folder for database seeding
COPY --from=builder /app/scripts ./scripts

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

# Start the production server
CMD ["node", "dist/index.cjs"]
