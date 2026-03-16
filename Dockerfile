# /front/Dockerfile

# Etapa 1: Build
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Genera la carpeta dist (o build)
RUN npm run build 

# Etapa 2: Servidor Nginx
FROM nginx:alpine
# Intentamos copiar 'out' si esa es la que genera Vite, o 'dist' si cambias la config.
# Según tu log, es 'out'.
COPY --from=build /app/out /usr/share/nginx/html
# Copiamos nuestra config de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]