FROM node:alpine

RUN mkdir -p /app
COPY src /app
WORKDIR /app
RUN npm install http express needle command-line-args
RUN npm install parse-url@6.0.0
ENTRYPOINT ["/bin/sh", "-c", "/app/entrypoint.sh"]
