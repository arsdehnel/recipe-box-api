FROM node:latest

RUN mkdir -p /home/nodejs/app
WORKDIR /home/nodejs/app

COPY . /home/nodejs/app
RUN npm install --production

WORKDIR /home/nodejs/app

EXPOSE 3000

CMD ["node", "index.js"]