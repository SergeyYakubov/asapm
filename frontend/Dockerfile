FROM node:14.4 AS base

RUN apt update && apt-get install -y libgtk2.0-0 libgtk-3-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

WORKDIR /src
ADD package.json package.json
ADD package-lock.json package-lock.json
RUN npm install

ADD . /src
ENTRYPOINT npm start

FROM node:14.4 AS builder
WORKDIR /src
COPY --from=base /src .
ENV PUBLIC_URL=__PLACEHOLDER_PUBLIC_URL__
RUN npm run build

FROM nginx:1.19.0
ENV PUBLIC_URL=/
ADD default.conf.template  /etc/nginx/templates/default.conf.template
COPY --from=builder /src/build /usr/share/nginx/html
COPY tweak_nginx.sh /docker-entrypoint.d/15_tweak_nginx.sh
RUN chmod +x /docker-entrypoint.d/15_tweak_nginx.sh