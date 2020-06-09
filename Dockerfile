FROM node:10 AS base

WORKDIR /src
ADD package.json package.json
ADD package-lock.json package-lock.json
RUN npm install --production
ADD . /src
ENTRYPOINT npm start

FROM node:10 AS builder
WORKDIR /src
COPY --from=base /src .
RUN npm run build

FROM nginx:1.19.0
ENV PUBLIC_URL="/"
ADD default.conf.template  /etc/nginx/templates/default.conf.template
COPY --from=builder /src/build /usr/share/nginx/html
