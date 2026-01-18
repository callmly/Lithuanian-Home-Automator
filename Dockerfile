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

# Install drizzle-kit for database migrations (needed at runtime)
RUN npm install drizzle-kit --save

# Copy built application (server + client)
COPY --from=builder /app/dist ./dist

COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/shared ./shared

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

# Start the production server
CMD ["node", "dist/index.cjs"]
