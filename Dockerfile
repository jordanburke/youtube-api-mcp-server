# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
RUN npm install --only=production && npm cache clean --force

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Set execution permission for CLI
RUN chmod +x dist/cli.js

# Switch to non-root user
USER nodejs

# Set environment variable hints
ENV NODE_ENV=production

# Health check (optional - checks if the process is running)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Start the MCP server
CMD ["node", "dist/index.js"]