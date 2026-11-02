# Stage 1: Build React app
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .

# Disable ESLint plugin to avoid version-mismatch errors in CI
ENV DISABLE_ESLINT_PLUGIN=true
ENV CI=false

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built React bundle to Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom Nginx config for React SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
