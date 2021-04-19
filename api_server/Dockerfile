FROM golang:1.14.4 AS base
WORKDIR /app/src
COPY src/go.mod /app/src
COPY src/go.sum /app/src
RUN go mod download
COPY src /app/src
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/asapm-api-server asapm/asapm/

FROM alpine
COPY --from=base /app /app
RUN apk add ca-certificates && update-ca-certificates
ENTRYPOINT /app/asapm-api-server -config /etc/asapm/config.json

