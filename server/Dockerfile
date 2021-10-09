FROM node:16-slim

WORKDIR /app

COPY ./db.json $WORKDIR

RUN npm install -g json-server

EXPOSE 3000

CMD [ "json-server", "--no-cors", "-H", "0.0.0.0", "--watch", "db.json" ]