FROM node:14.4 AS base

WORKDIR /src
ADD package.json package.json
ADD package-lock.json package-lock.json
RUN npm install
RUN apt update && apt-get install -y libgtk2.0-0 libgtk-3-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb

ADD . /src
ENTRYPOINT npm start

FROM node:14.4 AS builder
WORKDIR /src
COPY --from=base /src .
# this will build static files with asapm preif so that late nginx can locate files from path /xxx/asapm
# current dir will be /xxx/ and thus files undes asapm/... are available
ARG ENDPOINT_SUFFIX=asapm
ENV PUBLIC_URL=$ENDPOINT_SUFFIX
RUN npm run build

FROM nginx:1.19.0
ENV PUBLIC_URL=/
ADD default.conf.template  /etc/nginx/templates/default.conf.template
COPY --from=builder /src/build /usr/share/nginx/html
