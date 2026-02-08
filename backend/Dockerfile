FROM node:22-alpine

WORKDIR /app

# Install openssl for self-signed cert generation
RUN apk add --no-cache openssl

# Install dependencies first (Docker layer caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy Prisma schema (needed for prisma generate)
COPY prisma ./prisma

# Copy entrypoint script — fix CRLF and permissions during build
COPY entrypoint.sh ./
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

# CRITICAL: Use "sh" explicitly — without this, Node's docker-entrypoint
# tries to parse the .sh file as JavaScript (that's what caused your crash)
CMD ["sh", "./entrypoint.sh"]
