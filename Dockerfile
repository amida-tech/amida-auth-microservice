# node image
FROM node:8.16.0-alpine as builder

# set /app directory as default working directory
WORKDIR /app/
COPY . /app/

# Run yarn
RUN yarn install --pure-lockfile
RUN yarn build
RUN yarn install --production --frozen-lockfile

FROM node:8.16.0-alpine

WORKDIR /app/

COPY --from=builder /app/ /app/

# expose port 4000
EXPOSE 4000

# cmd to start service
CMD ["yarn", "serve"]
