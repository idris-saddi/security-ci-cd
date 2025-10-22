# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY app/package*.json ./
RUN npm install --production

# Copy application code
COPY app/ .

# Expose port
EXPOSE 3000

# Start the application
CMD [ "node", "server.js" ]