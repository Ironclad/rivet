# Use Node.js LTS as base image
FROM node:23.7.0-alpine3.21

# Create app directory and volume mount point
WORKDIR /app
VOLUME /project

# Install the Rivet CLI globally
RUN npm install -g @ironclad/rivet-cli

# Copy and set up the entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
