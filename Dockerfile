FROM node:18-alpine

# Set timezone to avoid hangs
ENV TZ=UTC

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with timeout and cleanup
RUN npm install --production --no-fund --no-audit --loglevel=error || \
    npm install --production --no-fund --no-audit --loglevel=error --timeout=60000

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Command to run the app
CMD ["npm", "start"]