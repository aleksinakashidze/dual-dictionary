FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG APP
RUN npx nx build ${APP} --configuration=production

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

ARG APP
COPY --from=builder /app/dist/apps/${APP} ./dist
COPY --from=builder /app/node_modules ./node_modules

CMD ["node", "dist/main.js"]
