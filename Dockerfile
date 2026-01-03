# Stage 1: Build the frontend
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production runtime
FROM node:20-bookworm-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY index.js ./
COPY shared/ ./shared/
COPY --from=frontend-builder /app/frontend/build ./frontend/build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "index.js"]
