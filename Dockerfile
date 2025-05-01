# Use an official lightweight Alpine Linux image
FROM alpine:latest

# Install necessary dependencies for the application
RUN apk add --no-cache nodejs npm

# Set the working directory
WORKDIR /app

# Copy application files into the image
COPY . .

# Install Node.js dependencies
RUN npm install

# Expose the application port (adjust if necessary)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]