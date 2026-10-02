
# =========================
# Stage 1 — Build
# =========================

FROM node:22-alpine AS builder

WORKDIR /front-end-app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# =========================
# Stage 2 — Production
# =========================

FROM nginx:alpine

# /api reverse-proxy target (compose: http://api:8000,
# standalone run: -e BACKEND_URL=http://host.docker.internal:8000)
ENV BACKEND_URL=http://api:8000

# nginx:alpine auto-renders /etc/nginx/templates/*.template -> conf.d/ on start
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=builder /front-end-app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]