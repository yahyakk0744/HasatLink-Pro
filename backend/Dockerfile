FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY tsconfig.json ./
COPY src/ ./src/
RUN rm -rf src/__tests__

RUN npx tsc

# Cleanup
RUN rm -rf src tsconfig.json
RUN npm prune --production --legacy-peer-deps

RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/index.js"]
