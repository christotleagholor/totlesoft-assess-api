# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies (only production for lean image)
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on (matching your .env PORT)
EXPOSE 8080

# Command to run the app
CMD ["npm", "start"]