# ---------- DEPENDENCIES STAGE ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- BUILD STAGE ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* variables are inlined into the client bundle at BUILD time, not read at
# container start -- so this has to be a build ARG, not just a runtime `environment:` entry
# in docker-compose.yml. docker-compose.yml passes this automatically; override it with
# `docker compose build --build-arg NEXT_PUBLIC_API_BASE_URL=https://your-domain` for a
# non-local deployment.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN npm run build

# ---------- RUN STAGE ----------
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S apiforge && adduser -S apiforge -G apiforge

# `output: "standalone"` (next.config.ts) produces a self-contained server bundle --
# copying just this instead of the full node_modules tree keeps the image small.
COPY --from=build /app/public ./public
COPY --from=build --chown=apiforge:apiforge /app/.next/standalone ./
COPY --from=build --chown=apiforge:apiforge /app/.next/static ./.next/static

USER apiforge
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "server.js"]
