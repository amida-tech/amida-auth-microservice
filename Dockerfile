# node image
FROM node:8.10.0

# set /app directory as default working directory
WORKDIR /app/
COPY . /app/

# set up public and private keys
RUN echo -e 'y\n'|ssh-keygen -q -t rsa -b 4096 -N "" -f private.key &&\
    openssl rsa -in private.key -pubout -outform PEM -out private.key.pub

RUN yarn install --pure-lockfile && \
    yarn build && \
    yarn install --production --frozen-lockfile

# expose port 4000
EXPOSE 4000

# cmd to start service
CMD yarn migrate && yarn serve
