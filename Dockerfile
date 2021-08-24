# Build Stage
FROM node:alpine AS builder

WORKDIR /build

COPY package*.json ./

RUN npm install

COPY --chown=node:node . .

RUN npm run build


# Production Stage
FROM node:alpine

ENV API_SERVER="http://localhost:80"
ENV EXPECTED_TOTAL="4000000"
ENV KEY_FILE="./AuthKey.p8"
ENV KEY_ID="BJ95W4GAK"
ENV TEAM_ID="J4IOS1OJ"
ENV APP_IDENTIFIER="reactnative.CryptoStashClient"

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node

COPY --from=builder --chown=node:node /build/dist ./src

COPY --from=builder --chown=node:node /build/package*.json ./

RUN npm install --only=prod

CMD [ "node", "src/index.js" ]