
# Use a lightweight nginx image as the base
FROM nginx:1.25-alpine

# Copy all the application files from the current directory
# to the default nginx public HTML directory.
COPY . /usr/share/nginx/html

# Expose port 80 for nginx
EXPOSE 80

# The default nginx command will start the server.
# CMD ["nginx", "-g", "daemon off;"]
