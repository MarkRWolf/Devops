FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

FROM node:22-alpine AS builder
WORKDIR /app
ARG SELF_URL
ENV SELF_URL=$SELF_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/ ./
RUN npm install --production --legacy-peer-deps
EXPOSE 3000
CMD ["npm","start"]
