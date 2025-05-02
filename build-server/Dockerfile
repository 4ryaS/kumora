# Use slim Node.js 20 base image (includes Debian slim and Node)
FROM node:22-slim

# Set working directory
WORKDIR /home/app

# Install curl, git (combine and clean up)
RUN apt-get update && \
    apt-get install -y curl git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies first (better for caching)
COPY package*.json ./
RUN npm install

# Copy rest of the app files
COPY run.sh run.sh
COPY script.js script.js

# Make scripts executable
RUN chmod +x run.sh script.js

# Set entrypoint
ENTRYPOINT [ "/home/app/run.sh" ]
