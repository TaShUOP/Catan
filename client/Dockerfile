# Build stage
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Set build argument for backend URL (optional)
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 5173
EXPOSE 5173

# Change default nginx port from 80 to 5173
RUN sed -i 's/listen  *80;/listen 5173;/' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
