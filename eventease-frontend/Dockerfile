
# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source
COPY . .

# Build React application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy production build to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose web server port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
