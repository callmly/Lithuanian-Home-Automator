FROM node:20-alpine AS builder

ARG RESEND_API_KEY
ARG SESSION_SECRET
ARG DATABASE_URL

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV SESSION_SECRET=${SESSION_SECRET}
ENV DATABASE_URL=${DATABASE_URL}

# Use npx to ensure tsx is found
RUN npx tsx script/build.ts

RUN ls -la dist/

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
RUN npm ci --production

COPY --from=builder /app/dist ./dist

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD curl -f http://localhost:5000/ || exit 1

CMD ["node", "dist/index.cjs"]
```

## Coolify Environment Variables:

Nepamirsk nustatyti **Is Build Variable** ✅:
```
RESEND_API_KEY=re_xxxxx (✅ Is Build Variable)
SESSION_SECRET=tavo-sugeneruotas-secret-32-chars (✅ Is Build Variable)
DATABASE_URL=postgresql://user:pass@host:5432/db (✅ Is Build Variable)
