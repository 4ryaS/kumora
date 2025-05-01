#!/bin/bash

# Exit immediately if a command fails
set -e

# Clone the Git repository from the environment variable
git clone "$GIT_REPOSITORY_URL" /home/app/output

# Execute the Node.js script
exec node script.js
