FROM node:22-alpine AS build

# В production-сборке значение намеренно пустое: frontend обращается к API
# через тот же origin, а Nginx проксирует запросы на backend:8000.
# При необходимости переопределите через --build-arg VITE_API_URL=https://...
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
