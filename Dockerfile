FROM node:16-slim

WORKDIR /app

COPY ./src $WORKDIR/src
COPY package.json $WORKDIR

RUN npm install

EXPOSE 3001

CMD ["npm", "run", "prod" ]