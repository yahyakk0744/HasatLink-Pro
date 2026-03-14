FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm install typescript

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# Build
RUN npx tsc

# Create uploads directory
RUN mkdir -p uploads

# Remove dev files
RUN rm -rf src tsconfig.json node_modules/typescript

EXPOSE 5000

CMD ["node", "dist/index.js"]
