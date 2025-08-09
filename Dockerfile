# ---------- base ----------
FROM node:22-alpine AS base
WORKDIR /app
# bikin layer ngebut untuk npm
RUN apk add --no-cache libc6-compat

# ---------- deps (full untuk build) ----------
FROM base AS deps
COPY package*.json ./
# install full deps (build butuh devDeps)
RUN npm ci

# ---------- build ----------
FROM base AS build
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# pastikan standalone output
RUN npm run build

# ---------- runner (tipis) ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
# sharp butuh libvips di runtime Alpine
RUN apk add --no-cache libc6-compat vips

# copy hanya artefak runtime standalone
# .next/standalone sudah berisi node_modules minimal + server.js
COPY --from=build /app/.next/standalone ./
# asset statis Next
COPY --from=build /app/.next/static ./.next/static
# kalau ada folder public, ikutkan
COPY --from=build /app/public ./public

EXPOSE 3000
# entrypoint untuk mode standalone
CMD ["node", "server.js"]
