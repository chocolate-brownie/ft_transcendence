FROM node:22-alpine

WORKDIR /app

# Install dependencies first (Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy all project files (index.html, configs, src, etc.)
COPY . .

# Ensure all files are readable
RUN chmod -R 755 /app

EXPOSE 5173

# Start Vite dev server — accessible from outside the container
CMD ["npx", "vite", "--host", "0.0.0.0"]
