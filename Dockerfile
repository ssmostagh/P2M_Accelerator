# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app source
COPY . .

# Creates a "dist" directory with the production build
RUN npm run build

# The container will listen on this port
EXPOSE 8080

# The command to run the application
CMD ["node", "server.js"]