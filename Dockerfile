### Forail Frontend — Production Dockerfile
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
COPY nginx.conf /etc/nginx/conf.d/forail.conf

# Copy built assets — Vite outputs to build/forail/ with base /static/forail/
COPY --from=builder /app/build/forail /usr/share/nginx/html/static/forail

# Also serve index at root for SPA routing
COPY --from=builder /app/build/forail/index_forail.html /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
