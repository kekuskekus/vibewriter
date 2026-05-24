FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* package-lock.json* ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN npm ci

# Build shared types and web
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create storage directories
RUN mkdir -p /data/documents /data/drafts /data/exports /data/affine-sync

# Expose port
EXPOSE 3000

# Set environment variables
ENV STORAGE_PATH=/data/documents
ENV DRAFTS_PATH=/data/drafts
ENV EXPORTS_PATH=/data/exports
ENV AFFINE_SYNC_PATH=/data/affine-sync
ENV PORT=3000
ENV HOST=0.0.0.0

# Start the server
CMD ["npm", "start", "-w", "apps/server"]
