FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/shared/package.json frontend/shared/package-lock.json ./frontend/shared/
COPY frontend/customer-web/package.json frontend/customer-web/package-lock.json ./frontend/customer-web/

RUN npm ci --prefix frontend/shared
RUN npm ci --prefix frontend/customer-web

COPY frontend/shared ./frontend/shared
COPY frontend/customer-web ./frontend/customer-web

RUN npm run build --prefix frontend/customer-web

FROM nginx:1.27-alpine

COPY infra/nginx/frontend-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/customer-web/dist /usr/share/nginx/html

EXPOSE 80
