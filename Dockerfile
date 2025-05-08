FROM node:18-alpine AS base

# Set environment variables to disable telemetry
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_TELEMETRY_DEBUG 1

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev postgresql-client

# Install dependencies based on the preferred package manager (including dev dependencies)
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_TELEMETRY_DEBUG 1
ENV NEXT_SKIP_DATA_COLLECTION 1
ENV NEXT_SKIP_API_PREPARATION 1
ENV ANALYZE false
ENV SKIP_LINTING 1
ENV PRISMA_CLIENT_ENGINE_TYPE library

# Create .env files with dummy API keys for build
RUN echo "OPENAI_API_KEY=sk-dummy-key-for-build" > .env.local
RUN echo "NEXT_SKIP_VALIDATE_ROUTE=1" >> .env.local
RUN echo "NEXT_SKIP_DATA_COLLECTION=1" >> .env.local
RUN echo "NEXT_SKIP_API_VALIDATION=1" >> .env.local
RUN echo "PRISMA_CLIENT_ENGINE_TYPE=library" >> .env.local

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev postgresql-client

# Use custom next.config.js for build to skip validation
RUN cp docker.next.config.js next.config.js

# Clean Prisma cache and regenerate with OpenSSL support
RUN rm -rf node_modules/.prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# Create stub API files to prevent validation errors
RUN mkdir -p .next/server/app/api/payment
RUN echo "export function GET() { return new Response('API disabled during build') }" > .next/server/app/api/payment/route.js
RUN mkdir -p .next/server/app/api/ai/tutor
RUN echo "export function GET() { return new Response('API disabled during build') }" > .next/server/app/api/ai/tutor/route.js

# Build with skipped validation
RUN npm run build --legacy-peer-deps

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install OpenSSL for Prisma in production and Sharp for image optimization
RUN apk add --no-cache openssl postgresql-client
RUN npm install --no-package-lock sharp

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PRISMA_CLIENT_ENGINE_TYPE library

# Map OPEN_AI_KEY to OPENAI_API_KEY for compatibility
ENV OPENAI_API_KEY ${OPEN_AI_KEY}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"] 