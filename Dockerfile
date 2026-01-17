FROM node:20-alpine AS builder

ARG RESEND_API_KEY
ARG SESSION_SECRET
ARG DATABASE_URL

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY . .

# DEBUG: Check index.html
RUN echo "=== Checking client structure ===" && \
    ls -la client/ && \
    echo "=== Checking index.html type ===" && \
    file client/index.html && \
    echo "=== Content preview ===" && \
    head -5 client/index.html || echo "ERROR: Cannot read index.html"

# Set environment variables
ENV NODE_ENV=production
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV SESSION_SECRET=${SESSION_SECRET}
ENV DATABASE_URL=${DATABASE_URL}

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ARG RESEND_API_KEY
ARG SESSION_SECRET
ARG DATABASE_URL

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV SESSION_SECRET=${SESSION_SECRET}
ENV DATABASE_URL=${DATABASE_URL}

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD curl -f http://localhost:5000/ || exit 1

CMD ["node", "dist/index.cjs"]
