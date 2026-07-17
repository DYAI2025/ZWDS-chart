# Railway build for the BaZodiac BFF + SPA WITH a real Chromium runtime for the
# server-side PDF (REQ-013). The Nixpacks `aptPkgs` path did not provision Chromium on
# this service (builds finished in ~12s and /usr/bin/chromium was absent), so we pin an
# explicit Docker build: Debian bookworm has an apt `chromium` at /usr/bin/chromium and
# `fonts-noto-cjk` for the 命宮/官祿宮 glyphs the report grid renders.
FROM node:22-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      chromium \
      fonts-noto-cjk \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Matches PUPPETEER_EXECUTABLE_PATH; renderPdf launches this binary with --no-sandbox.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install with the committed lockfile. --include=dev so the Vite/tsc build toolchain is
# present even if the platform sets NODE_ENV=production (npm would otherwise omit devDeps
# and `npm run build` would fail).
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# Railway injects PORT (the server reads process.env.PORT); the BFF serves dist/ + /api.
CMD ["node", "server/index.mjs"]
