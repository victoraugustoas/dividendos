FROM node:16-slim
FROM buildkite/puppeteer

WORKDIR /app

COPY . $WORKDIR

RUN npm install

EXPOSE 3001

CMD ["npm", "run", "prod" ]