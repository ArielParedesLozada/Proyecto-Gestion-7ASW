# Etapa 1: build Angular

FROM node:20 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

# Etapa 2: nginx

FROM nginx:alpine

RUN rm -rf /etc/nginx/conf.d/*

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Ajustar nombre de app

COPY --from=build /app/dist/sicop-frontend/browser /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
