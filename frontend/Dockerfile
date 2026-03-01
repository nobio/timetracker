# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files from the frontend folder
#COPY frontend/package.json frontend/package-lock.json ./
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code from the frontend folder
COPY . .

# Build the Next.js app
RUN npm run build

# Runtime stage
FROM node:24-alpine


WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy production package files from the frontend folder
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000 3000

# Use dumb-init to run Node
ENTRYPOINT ["dumb-init", "--"]

# Start the Next.js app
CMD ["npm", "start"]
