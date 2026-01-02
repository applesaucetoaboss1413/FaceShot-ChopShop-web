# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production environment
FROM node:18-alpine
WORKDIR /app

# Install backend dependencies
COPY new_backend/package*.json ./new_backend/
WORKDIR /app/new_backend
RUN npm install --production

# Copy backend source code
COPY new_backend/ ./
COPY shared/ ../shared/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/build ../frontend/build

# Environment setup
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
