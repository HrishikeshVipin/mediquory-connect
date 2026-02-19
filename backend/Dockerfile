FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src/
COPY assets ./assets/ 2>/dev/null || true

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
