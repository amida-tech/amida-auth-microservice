# node image
FROM node:8.14.0-alpine as builder

# set /app directory as default working directory
WORKDIR /app/
COPY . /app/

# Run yarn
RUN yarn install --pure-lockfile
RUN yarn build
RUN yarn install --production --frozen-lockfile

FROM node:8.14.0-alpine

WORKDIR /app/

COPY --from=builder /app/ /app/

# Obtain ssh-keygen and patch for snyk
RUN apk update && apk add --no-cache openssh-keygen && apk add --no-cache openssl && apk add --no-cache patch

# set up public and private keys
RUN echo -e 'y\n'|ssh-keygen -q -t rsa -b 4096 -N "" -f private.key && \
    openssl rsa -in private.key -pubout -outform PEM -out private.key.pub

# expose port 4000
EXPOSE 4000

# cmd to start service
CMD ["yarn", "serve"]
