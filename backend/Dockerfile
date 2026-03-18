FROM node:20-alpine

# Sharp native dependency
RUN apk add --no-cache vips-dev python3 make g++

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source (exclude tests)
COPY tsconfig.json ./
COPY src/ ./src/
RUN rm -rf src/__tests__

# Build TypeScript
RUN npx tsc

# Cleanup dev stuff to reduce image size
RUN rm -rf src tsconfig.json
RUN npm prune --production --legacy-peer-deps
RUN apk del python3 make g++

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/index.js"]
