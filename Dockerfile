FROM node:20-alpine

# Set timezone to avoid hangs
ENV TZ=UTC

WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm ci for faster, more reliable installs
# If you don't have package-lock.json, use npm install --omit=dev
RUN npm ci --omit=dev --no-fund --no-audit --loglevel=error || \
    npm install --omit=dev --no-fund --no-audit --loglevel=error

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Health check (keep as-is, this is fine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Command to run the app
CMD ["npm", "start"]