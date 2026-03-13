# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Runner
FROM node:22-alpine AS runner

# Set non-root user for security
USER node

WORKDIR /usr/src/app

# Set node environment
ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY --chown=node:node package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts from the builder stage
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# Expose the API port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
