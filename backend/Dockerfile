FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies. For local development, we run this as root
# to avoid permissions issues with mounted volumes.
RUN npm install

# Copy the rest of your application's source code into the container.
COPY . .

# We will install Prisma later, for now just start the app
# The command to start your application.
# This will be executed as the root user.
CMD ["npm", "run", "start:dev"]
