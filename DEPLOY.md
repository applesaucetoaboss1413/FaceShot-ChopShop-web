# Deployment Guide

This guide explains how to deploy the Telegram A2E Web App using Docker.

## Prerequisites

- Docker and Docker Compose installed on the server.
- A Telegram Bot Token.
- Stripe API Keys.
- Cloudinary API Credentials.

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd telegram-a2e-web
   ```

2. **Configure Environment Variables:**
   Copy the example environment file and fill in your secrets.
   ```bash
   cp scripts/.env.example .env
   nano .env
   ```
   Ensure `NODE_ENV=production` and `DB_PATH=/app/new_backend/production.db` are set (or use defaults in docker-compose).

3. **Initialize Database File:**
   Create an empty database file to be mounted by Docker.
   ```bash
   touch new_backend/production.db
   ```

## Build and Run

1. **Build and Start the Container:**
   ```bash
   docker-compose up -d --build
   ```

2. **Verify Deployment:**
   Check if the container is running:
   ```bash
   docker-compose ps
   ```
   The application should be accessible at `http://localhost:3000` (or your server's IP).

3. **View Logs:**
   ```bash
   docker-compose logs -f
   ```

## Management

- **Stop the application:**
  ```bash
  docker-compose down
  ```

- **Update the application:**
  Pull the latest changes and rebuild:
  ```bash
  git pull
  docker-compose up -d --build
  ```

## Data Persistence

The SQLite database is mounted as a volume:
- Host path: `./new_backend/production.db`
- Container path: `/app/new_backend/production.db`

This ensures that your user data and job history are preserved even if the container is destroyed.
