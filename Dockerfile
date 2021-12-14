FROM node:16-slim

WORKDIR /app

COPY . $WORKDIR

RUN npm install

EXPOSE 3001

CMD ["npm", "run", "prod" ]