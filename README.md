# Amida Auth Microservice

## Table of Contents
  - [Prerequisites](#prerequisites)
  - [Docker](#docker)
  - [Design](#design)
  - [Development](#development)
  - [Deployment](#deployment)
  - [Changelog](#changelog)

## Prerequisites

Before using the auth-microservice, you will require a Postgres database of 9.4 through 9.6. It maybe possible to use a higher database, but it is untested.

If you do not have a Postgres database setup, the fastest way to ready it (complete with immediate user and database) is to run the following command in Docker:

Production Example: `docker run --name auth-micro-db -e POSTGRES_DB=auth_api -e POSTGRES_PASSWORD=alacrity -e POSTGRES_USER=amida --network micro-net -d postgres:9.6`
Development Example: `docker run --name auth-micro-db -e POSTGRES_DB=auth_api -e POSTGRES_PASSWORD=alacrity -e POSTGRES_USER=amida -p 5432:5432 -d postgres:9.6`


Environmental variables for this include the following (if you modify these, you will have to update your auth microservice .env file or runtime variables as well):

### POSTGRES_DB
The name of the database that the auth service will connect to.

### POSTGRES_PASSWORD
The password for the POSTGRES_USER with which the user will connect to. Note, if you are using pgAdmin, don't forget to click "Properties" and change the user you use to login.

### POSTGRES_USER
The user in the POSTGRES_DB who manages the data.

### -p 5432:5432
If you want to directly connect to the database for any reason (such as using pgAdmin), you will have to expose the port to connect to. Useful for development or triaging.

### --network micro-net
Makes the database part of the `micro-net` network on your Docker instance. Ideal for production. If you opt to create a network, run this before: `docker network create micro-net`. You can use whatever name you prefer, just remember to be consistent across your other microservice deployments.

For further variables, please check the PostgreSQL documentation on their docker hub. (https://hub.docker.com/_/postgres/)

## Docker

This section covers a quick and dirty deployment for those who don't want to dive into the details below.
Don't forget to run a build: `docker build -t auth-micro .`
Production Example: `docker run -e PG_DB=auth_api -e PG_PASSWD=alacrity -e PG_USER=amida --name auth-micro3 -e PG_HOST=auth-micro-db -p 4000:4000 --network micro-net -e JWT_SECRET=locationOfTheJadeMonkey auth-micro`
Development Example: `docker run -e PG_DB=auth_api -e PG_PASSWD=alacrity -e PG_USER=amida --name auth-micro3 -e PG_HOST=auth-micro-db --link auth-micro-db:auth-micro-db -p 4000:4000 -e JWT_SECRET=myLittlePoniesAreEatingMyBrain auth-micro`

Environmental variables for this include the following:

### PG_DB
The auth database, mentioned under #prerequisites. This will house all the users and tokens.

### PG_USER
The username with access to the `PG_DB`.

### PG_PASSWD
The associated password for `PG_USER`.

### JWT_SECRET
The auth service secret that is shared with other services, allowing for cross-service authentication. Important.

### --link <database name:database name>
If you are not using a Docker network (`--network <net>`) or exposing the auth database port (`-p 5432:5432`), you can use this command to permit communication between the auth service and the database.

### --network micro-net
Associates the auth service with the `micro-net` service. If you followed the instructions above, the auth database will be part of this same network, and thus you would neither have to expose the port nor use `--link`.

### -p 4000:4000
Exposes port 4000 for use by other services and applications.

## Design

### Integration with other services

In order to use the auth microservice with other applications, you will need to protect your API resources with a JWT strategy. The easiest way to do this is with [Passport JWT](https://www.npmjs.com/package/passport-jwt), which is what this repository uses for its own protected resources. For direct examples of how we set up the strategy, take a look at [passport.js](./config/passport.js), [express.js](./config/express.js), and [auth.route.js](./server/routes/auth.route.js).

In general, the authentication flow will be as follows:
1. `POST /login` with username and password to get a token.
2. Send the JWT in a header `Authorization: Bearer <JWT>` when using a protected resource.

It is the responsibility of the integrated service to extract the JWT, verify it against a shared secret or public/private key pair, and use it to fetch information on the authenticated User.
For example, one API endpoint could allow _any_ authenticated user to view certain information about all users. Another endpoint may allow password updates, but only for the specific authenticated user. It is up to the developer to ensure that endpoints are protected appropriately.

#### Roles
In order to support fine-grained permissions, the User model contains a `scopes` field. This is an array of arbitrary strings meant to indicate roles and permissions for a User. Within the auth service, the only significant scope is `admin`. Other scopes may be added and used as necessary.

#### Signing algorithm
By default, the auth service signs JWTs with HMAC. This relies on a shared secret between the auth service and the consuming service. Whenever possible, you should use the RSA implementation. This can be activated by setting JWT_MODE='rsa' and setting the JWT_PRIVATE_KEY_PATH to the location of a private key. The public key should be available for the consuming service in order to verify the JWTs, and the auth service should locate the public key via JWT_PUBLIC_KEY_PATH.

To generate a keypair:
```sh
ssh-keygen -t rsa -b 4096 -f private.key
openssl rsa -in private.key -pubout -outform PEM -out private.key.pub
```

### Seeding
Since many operations require an admin user, you may find it easiest to begin using the service with a default admin user, to be removed later.
To create this user, simply run `yarn seed`.

### API Spec
Interactive Apiary docs can be found at http://docs.amidaauth.apiary.io/.

The spec can be viewed at https://amida-tech.github.io/amida-auth-microservice/.

To update the spec, first edit the files in the docs directory. Then run `aglio -i apiary.apib --theme flatly -o index.html`.

### External auth
The Amida Auth service can allow external OAuth providers to manage identity. If a user is created via external auth, they will still get an entry in the Users database. However, they will not get a password, and password management functions will be disabled for that user. The `provider` column will contain an identifier for the OAuth provider managing that user.

To specify the external auth used for an instance of the service, use the `*_CLIENT_ID` env vars. Allowed strategies are shown in `config/config.js`.

#### Facebook
To set up integration with Facebook, configure your domain for the auth service as a Facebook Login product with `<domain>/api/vX/auth/facebook/callback` as a redirect URL, then set the following env vars:
```
FACEBOOK_CLIENT_ID
FACEBOOK_CLIENT_SECRET
FACEBOOK_CALLBACK_URL
```
Clients can then get a JWT by doing a `GET` for `/api/vX/auth/facebook` and logging in to Facebook.

### Features

| Feature                                | Summary                                                                                                                                                                                                                                                     |
|----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ES6 via Babel                  	 	 | ES6 support using [Babel](https://babeljs.io/).  |
| Code Linting               			 | Linting with [eslint](https://www.npmjs.com/package/eslint)                                                                                            |
| Auto server restart                  	 | Restart the server using [nodemon](https://github.com/remy/nodemon) in real-time anytime an edit is made, with babel compilation and eslint.                                                                                                                                                                            |
| ES6 Code Coverage via [istanbul](https://www.npmjs.com/package/istanbul)                  | Supports code coverage of ES6 code using istanbul and mocha. Code coverage reports are saved in `coverage/` directory post `yarn test` execution. Open `coverage/lcov-report/index.html` to view coverage report. `yarn test` also displays code coverage summary on console. Code coverage can also be enforced overall and per file as well, configured via .istanbul.yml                                                                                                                                                                            |
| Debugging via [debug](https://www.npmjs.com/package/debug)           | Instead of inserting and deleting console.log you can replace it with the debug function and just leave it there. You can then selectively debug portions of your code by setting DEBUG env variable. If DEBUG env variable is not set, nothing is displayed to the console.                       |
| Promisified Code via [bluebird](https://github.com/petkaantonov/bluebird)           | We love promises, don't we? All our code is promisified and even so our tests via [supertest](https://www.npmjs.com/package/supertest).                       |
| API parameter validation via [express-validation](https://www.npmjs.com/package/express-validation)           | Validate body, params, query, headers and cookies of a request (via middleware) and return a response with errors; if any of the configured validation rules fail. You won't anymore need to make your route handler dirty with such validations. |
| Pre-commit hooks           | Runs lint and tests before any commit is made locally, making sure that only tested and quality code is committed
| Secure app via [helmet](https://github.com/helmetjs/helmet)           | Helmet helps secure Express apps by setting various HTTP headers. |
| Uses [yarn](https://yarnpkg.com) over npm            | Uses new released yarn package manager by facebook. You can read more about it [here](https://code.facebook.com/posts/1840075619545360) |

- CORS support via [cors](https://github.com/expressjs/cors)
- Uses [http-status](https://www.npmjs.com/package/http-status) to set http status code. It is recommended to use `httpStatus.INTERNAL_SERVER_ERROR` instead of directly using `500` when setting status code.
- Has `.editorconfig` which helps developers define and maintain consistent coding styles between different editors and IDEs.

## Development

Install yarn:
```js
npm install -g yarn
```

Install dependencies:
```sh
yarn
```

Set environment vars:
```sh
cp .env.example .env
```

Start server:
```sh
# Start server
yarn start

# Selectively set DEBUG env var to get logs
DEBUG=amida-auth-microservice:* yarn start
```

Tests:
```sh
# Run tests written in ES6
yarn test

# Run test along with code coverage
yarn test:coverage

# Run tests on file change
yarn test:watch

# Run tests enforcing code coverage (configured via .istanbul.yml)
yarn test:check-coverage
```

Lint:
```sh
# Lint code with ESLint
yarn lint

# Run lint on any file change
yarn lint:watch
```

Other gulp tasks:
```sh
# Wipe out dist and coverage directory
gulp clean

# Default task: Wipes out dist and coverage directory. Compiles using babel.
gulp
```

### Unit testing against auth
To make it easier to unit test against the auth service, you can generate dummy tokens by going to jwt.io. You should enter, at minimum, the following information:

Header:
```
{
  "alg": "HS256",
  "typ": "JWT"
}
```

Payload:
```
{
  "id": <userId>,
  "username": <username>,
  "email": <email>,
  "scopes": [""]
}
```
If you need an admin token, enter `"admin"` in the scopes array.

Then, in the "Verify Signature" section, enter the shared secret used by the app you are authenticating for.


## Deployment

### Manual deployment with `pm2`
```sh
# compile to ES5
1. yarn build

# upload dist/ to your server
2. scp -rp dist/ user@dest:/path

# install production dependencies only
3. yarn --production

# Use any process manager to start your services
4. pm2 start dist/index.js
```

### Deployment to AWS with Packer and Terraform
You will need to install [pakcer](https://www.packer.io/) and [terraform](https://www.terraform.io/) installed on your local machine.
Be sure to have your postgres host running and replace the `pg_host` value in the command below with the postgres host address. The command in `1.` below will allow you to build the AMI with default settings. You may also need to include additional environment variables in `./deploy/roles/api/templates/env.service.j2` before build.
1. First validate the AMI with a command similar to ```packer validate -var 'aws_access_key=myAWSAcessKey'
-var 'aws_secret_key=DmAI2PRWkefeBaCQg38qULUYiMH4GtYr3ogjYF4k' \
-var 'build_env=development' \
-var 'logstash_host=logstash.amida.com' \
-var 'service_name=amida_auth_microservice' \
-var 'ami_name=api-auth-service-boilerplate' \
-var 'node_env=development' \
-var 'jwt_secret=0a6b944d-d2fb-46fc-a85e-0295c986cd9f' \
-var 'jwt_mode=hmac' \
-var 'pg_host=amid-messages-packer-test.czgzedfwgy7z.us-west-2.rds.amazonaws.com' \
-var 'pg_db=amida_messages' \
-var 'pg_user=amida_messages' \
-var 'pg_passwd=amida-messages' template.json```
2. If the validation from `1.` above succeeds, build the image by running the same command but replacing `validate` with `build`
3. In the AWS console you can test the build before deployment. To do this, launch an EC2 instance with the built image and visit the health-check endpoint at <host_address>:4000/api/health-check. Be sure to launch the instance with security groups that allow http access on the app port (currently 4000) and access from Postgres port of the data base. You should see an "OK" response.
4. Enter `aws_access_key` and `aws_secret_key` values in the vars.tf file
5. run `terraform plan` to validate config
6. run `terraform apply` to deploy
7. To get SNS Alarm notifications be sure that you are subscribed to SNS topic arn:aws:sns:us-west-2:844297601570:ops_team_alerts and you have confirmed subscription

#### Terraform VPC architecture

![Architecture Diagram](/deploy/Hybrid Cloud Architecture.png?raw=true "Reference Architecture")

`deploy/terraform_vpc` contains additional Terraform files for creating a Virtual Private Cloud (VPC) designed for a 3-tier service.

This configuration is meant as a reference architecture. It creates a VPC with appropriate subnets and ingresses to protect the auth application and the auth database. It will also provision an RDS instance to serve as the database.

While this config provisions a VPC and a multi-AZ RDS instance, the service and load balancing is left up to the deployment implementation.
The second private subnet group should hold an autoscaling group across AZs, while the public subnet should hold an Elastic Load Balancer to the EC2 service instances.
The Bastion jumpbox can be used for debugging and maintenance inside the VPC.

In a deployment with an application using other services, you would want to maintain a similar VPC configuration, while adding other service AMIs to the deployment.

Further details can be found in the `deploy` directory.

### Docker deployment
Docker Compose:
```sh
docker-compose up
```

### Kubernetes Deployment
See the [paper](https://paper.dropbox.com/doc/Amida-Microservices-Kubernetes-Deployment-Xsz32zX8nwT9qctitGNVc) write-up for instructions on how to deploy with Kubernetes. The `kubernetes.yml` file contains the deployment definition for the project.

### Logging

Universal logging library [winston](https://www.npmjs.com/package/winston) is used for logging. It has support for multiple transports. A transport is essentially a storage device for your logs. Each instance of a winston logger can have multiple transports configured at different levels. For example, one may want error logs to be stored in a persistent remote location (like a database), but all logs output to the console or a local file. We just log to the console for simplicity, but you can configure more transports as per your requirement.


### Changelog

  - v1.0.0 - Changing the format of error codes (Please remember to bump version number of the api)
  - v0.2.0 - Beta
