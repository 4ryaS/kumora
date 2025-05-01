# Base image: Ubuntu 20.04 LTS
FROM ubuntu:focal

# Update package list
RUN apt-get update

# Install curl for downloading external resources
RUN apt-get install -y curl

# Set up Node.js 20.x from NodeSource
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -

# Upgrade existing packages
RUN apt-get upgrade -y

# Install Node.js (includes npm)
RUN apt-get install -y nodejs

# Install Git
RUN apt-get install git -y

# Set working directory
WORKDIR /home/app

# Copy the startup script into the container
COPY run.sh run.sh

# Copy the Node.js application script
COPY script.js script.js

# Copy package.json and package-lock.json (if present)
COPY package*.json .

# Install Node.js dependencies
RUN npm install

# Make scripts executable
RUN chmod +x run.sh
RUN chmod +x script.js

# Run the script when the container starts
ENTRYPOINT [ "/home/app/run.sh" ]