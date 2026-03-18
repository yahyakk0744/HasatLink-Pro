## ─── Builder Stage ───
FROM node:20-alpine AS builder

# Sharp needs these native deps on Alpine
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

# Install ALL dependencies (including devDeps for TypeScript compilation)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source (exclude tests)
COPY tsconfig.json ./
COPY src/ ./src/
RUN rm -rf src/__tests__

# Build TypeScript
RUN npx tsc

## ─── Production Stage ───
FROM node:20-alpine

# Sharp runtime dependency
RUN apk add --no-cache vips

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/index.js"]
