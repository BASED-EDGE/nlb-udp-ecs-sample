FROM node:20-alpine as development

# Create app directory
WORKDIR /usr/app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY . ./

RUN npm run build

FROM node:20-alpine as production

ENV NODE_ENV=production

WORKDIR /usr/app

COPY package.json ./
COPY package-lock.json ./

RUN npm i --production

COPY --from=development /usr/app ./

ENTRYPOINT ["npm", "run"]

CMD ["start"]

# todo: add health check for container