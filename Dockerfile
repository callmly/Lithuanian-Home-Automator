FROM node:20-alpine AS builder

ARG RESEND_API_KEY
ARG SESSION_SECRET
ARG DATABASE_URL

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ file

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy ONLY specific directories (avoid .dockerignore issues)
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY script ./script
#COPY db ./db
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# DEBUG: Verify index.html
RUN echo "=== Checking index.html ===" && \
    ls -lah client/index.html && \
    file client/index.html && \
    cat client/index.html && \
    echo "=== End of index.html ===" || echo "ERROR: index.html not found or unreadable"

# Set environment variables
ENV NODE_ENV=production
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV SESSION_SECRET=${SESSION_SECRET}
ENV DATABASE_URL=${DATABASE_URL}

# Build
RUN npm run build

# Verify build output
RUN ls -la dist/

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
