### Forge Frontend — Production Dockerfile
### Multi-stage: build with Node.js, serve with nginx

# ── Stage 1: Build ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve ─────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/forge.conf

# Copy built assets — Vite outputs to build/forge/ with base /static/forge/
COPY --from=builder /app/build/forge /usr/share/nginx/html/static/forge

# Also serve index at root for SPA routing
COPY --from=builder /app/build/forge/index_forge.html /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
