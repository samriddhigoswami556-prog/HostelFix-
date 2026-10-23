# ==========================================================
# HARDENED PRODUCTION DOCKERFILE (Assignment 3 Compliant)
# Base Image: node:20-alpine (Lightweight ~170 MB)
# Hardening:
#   1. Minimal Alpine Linux distribution (zero/low CVE surface)
#   2. Non-root user execution ('node' user, UID 1000)
#   3. Omission of devDependencies and build tools
#   4. Cache eviction and least-privilege directory permissions
# ==========================================================

FROM node:20-alpine

# Set secure production environment
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Ensure security patches
RUN apk --no-cache upgrade

# Copy package descriptors with strict ownership
COPY --chown=node:node package*.json ./

# Install only production dependencies and purge npm cache
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code with non-root ownership
COPY --chown=node:node . .

# Enforce non-root execution
USER node

# Expose backend application port
EXPOSE 5000

# Health check instruction
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Launch application
CMD ["node", "server.js"]
