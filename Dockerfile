# take default image of node boron i.e  node 6.x
FROM node:6.9.1
RUN npm i -g yarn

# create app directory in container
RUN mkdir -p /app

# set /app directory as default working directory
WORKDIR /app

# only copy package.json initially so that `RUN yarn` layer is recreated only
# if there are changes in package.json
ADD . /app/
RUN yarn

# compile to ES5
RUN yarn build

# set up dotenv
RUN echo "NODE_ENV=${NODE_ENV}\n" >> .env &&\
    echo "PORT=4000\n" >> .env &&\
    echo "JWT_MODE=${JWT_MODE}\n" >> .env &&\
    echo "JWT_PRIVATE_KEY_PATH=private.key\n" >> .env &&\
    echo "JWT_PUBLIC_KEY_PATH=private.key.pub\n" >> .env &&\
    echo "JWT_SECRET=${JWT_SECRET}" >> .env &&\
    echo "PG_DB=${PG_DB}\n" >> .env &&\
    echo "PG_PORT=${PG_PORT}\n" >> .env &&\
    echo "PG_HOST=${PG_HOST}\n" >> .env &&\
    echo "PG_USER=${PG_USER}\n" >> .env &&\
    echo "PG_PASSWD=${PG_PASSWD}\n" >> .env &&\
    echo "MAILER_SERVICE_PROVIDER=${MAILER_SERVICE_PROVIDER}\n" >> .env &&\
    echo "MAILER_EMAIL_ID=${MAILER_EMAIL_ID}\n" >> .env &&\
    echo "MAILER_PASSWORD=${MAILER_PASSWORD}\n" >> .env

# set up public and private keys
RUN echo -e 'y\n'|ssh-keygen -q -t rsa -b 4096 -N "" -f private.key &&\
    openssl rsa -in private.key -pubout -outform PEM -out private.key.pub

# expose port 4000
EXPOSE 4000

# cmd to start service
CMD [ "node", "dist/index.js" ]
