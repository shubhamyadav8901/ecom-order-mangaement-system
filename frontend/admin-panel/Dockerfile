FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/shared/package.json frontend/shared/package-lock.json ./frontend/shared/
COPY frontend/admin-panel/package.json frontend/admin-panel/package-lock.json ./frontend/admin-panel/

RUN npm ci --prefix frontend/shared
RUN npm ci --prefix frontend/admin-panel

COPY frontend/shared ./frontend/shared
COPY frontend/admin-panel ./frontend/admin-panel

RUN npm run build --prefix frontend/admin-panel

FROM nginx:1.27-alpine

COPY infra/nginx/frontend-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/admin-panel/dist /usr/share/nginx/html

EXPOSE 80
