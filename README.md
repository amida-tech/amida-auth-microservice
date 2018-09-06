# Amida Auth Microservice

# Table of Contents

  - [Design](#design)
  - [Development](#development)
  - [Deployment](#deployment)
  - [Environment Variables](#Environment-Variables)

# Design

## Integration with other services

In order to use the auth microservice with other applications, you will need to protect your API resources with a JWT strategy. The easiest way to do this is with [Passport JWT](https://www.npmjs.com/package/passport-jwt), which is what this repository uses for its own protected resources. For direct examples of how we set up the strategy, take a look at [passport.js](./config/passport.js), [express.js](./config/express.js), and [auth.route.js](./server/routes/auth.route.js).

In general, the authentication flow will be as follows:
1. `POST /login` with username and password to get a token.
2. Send the JWT in a header `Authorization: Bearer <JWT>` when using a protected resource.

It is the responsibility of the integrated service to extract the JWT, verify it against a shared secret or public/private key pair, and use it to fetch information on the authenticated User.
For example, one API endpoint could allow _any_ authenticated user to view certain information about all users. Another endpoint may allow password updates, but only for the specific authenticated user. It is up to the developer to ensure that endpoints are protected appropriately.

### Roles

In order to support fine-grained permissions, the User model contains a `scopes` field. This is an array of arbitrary strings meant to indicate roles and permissions for a User. Within the auth service, the only significant scope is `admin`. Other scopes may be added and used as necessary.

### Signing algorithm

By default, the auth service signs JWTs with HMAC. This relies on a shared secret between the auth service and the consuming service. Whenever possible, you should use the RSA implementation. This can be activated by setting `AUTH_SERVICE_JWT_MODE='rsa'` and setting the `AUTH_SERVICE_JWT_PRIVATE_KEY_PATH` to the location of a private key. The public key should be available for the consuming service in order to verify the JWTs, and the auth service should locate the public key via `AUTH_SERVICE_JWT_PUBLIC_KEY_PATH`.

To generate a keypair:
```sh
ssh-keygen -t rsa -b 4096 -f private.key
openssl rsa -in private.key -pubout -outform PEM -out private.key.pub
```

## Seeding

Since many operations require an admin user, you may find it easiest to begin using the service with a default admin user, to be removed later.
To create this user, simply run `yarn seed`.

## API Spec

Interactive Apiary docs can be found at http://docs.amidaauth.apiary.io/.

The spec can be viewed at https://amida-tech.github.io/amida-auth-microservice/.

To update the spec, first edit the files in the docs directory. Then run `aglio -i apiary.apib --theme flatly -o index.html`.

## External auth

The Amida Auth service can allow external OAuth providers to manage identity. If a user is created via external auth, they will still get an entry in the Users database. However, they will not get a password, and password management functions will be disabled for that user. The `provider` column will contain an identifier for the OAuth provider managing that user.

To specify the external auth used for an instance of the service, use the `*_CLIENT_ID` env vars. Allowed strategies are shown in `config/config.js`.

### Facebook

To set up integration with Facebook, configure your domain for the auth service as a Facebook Login product with `<domain>/api/vX/auth/facebook/callback` as a redirect URL, then set the following env vars:
```
FACEBOOK_CLIENT_ID
FACEBOOK_CLIENT_SECRET
FACEBOOK_CALLBACK_URL
```
Clients can then get a JWT by doing a `GET` for `/api/vX/auth/facebook` and logging in to Facebook.

## Logging

Universal logging library [winston](https://www.npmjs.com/package/winston) is used for logging. It has support for multiple transports. A transport is essentially a storage device for your logs. Each instance of a winston logger can have multiple transports configured at different levels. For example, one may want error logs to be stored in a persistent remote location (like a database), but all logs output to the console or a local file. We just log to the console for simplicity, but you can configure more transports as per your requirement.

## Features

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

# Development

## Setup

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
cp .env .env.test
```

Create the database:

When you `yarn start` the first time (see the [Development > Run](#Run) section), a script will automatically create the database schema. However, this will only work if your postgres instance has:

1. A database matching your `.env` file's `AUTH_SERVICE_PG_DB` name
2. A user matching your `.env` file's `AUTH_SERVICE_PG_USER` name, which has sufficient permissions to modify your `AUTH_SERVICE_PG_DB`.

Therefore, in your Postgres instance, create that user and database now.

## Run

Start server:
```sh
# Start server
yarn start

# Selectively set DEBUG env var to get logs
DEBUG=amida-auth-microservice:* yarn start
```

## Tests

```sh
# Run tests written in ES6
# Make sure .env.test exists
yarn test

# Run test along with code coverage
yarn test:coverage

# Run tests on file change
yarn test:watch

# Run tests enforcing code coverage (configured via .istanbul.yml)
yarn test:check-coverage
```

## Lint

```sh
# Lint code with ESLint
yarn lint

# Run lint on any file change
yarn lint:watch
```

## Other gulp tasks
```sh
# Wipe out dist and coverage directory
gulp clean

# Default task: Wipes out dist and coverage directory. Compiles using babel.
gulp
```

## Unit testing against auth
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


# Deployment

## Deployment Via Docker

Docker deployment requires two docker containers:
- An instance of the official Postgres docker image (see https://hub.docker.com/_/postgres ).
- An instance of this service's docker image (see https://hub.docker.com/r/amidatech/auth-service ).

The Postgres container must be running _before_ the auth-service container is started because, upon initial run, the auth-service container defines the schema within the Postgres database.

Also, the containers communicate via a docker network. Therefore,

1. First, create the Docker network:

```sh
docker network create {DOCKER_NETWORK_NAME}
```

2. Start the postgres container:

```sh
docker run -d --name {AUTH_SERVICE_PG_HOST} --network {DOCKER_NETWORK_NAME} \
-e POSTGRES_DB={AUTH_SERVICE_PG_DB} \
-e POSTGRES_USER={AUTH_SERVICE_PG_USER} \
-e POSTGRES_PASSWORD={AUTH_SERVICE_PG_PASSWORD} \
postgres:9.6
```

3. Create a `.env` file for use by this service's docker container. A good starting point is `.env.production`.

4. Start the auth-service container:

```sh
docker run -d -p 4000:4000 \
--name amida-auth-microservice --network {DOCKER_NETWORK_NAME} \
-v {ABSOLUTE_PATH_TO_YOUR_ENV_FILE}:/app/.env:ro \
amidatech/auth-service
```

### With docker-compose

Alternatively, there is also a docker-compose.yml file. Therefore, you can:

```sh
docker-compose up
```

## Deployment to AWS with Packer and Terraform
You will need to install [packer](https://www.packer.io/) and [terraform](https://www.terraform.io/) installed on your local machine.
Be sure to have your postgres host running and replace the `auth_service_pg_host` value in the command below with the postgres host address. The command in `1.` below will allow you to build the AMI with default settings. You may also need to include additional environment variables in `./deploy/roles/api/templates/env.service.j2` before build.
1. First validate the AMI with a command similar to

```
packer validate -var 'aws_access_key=myAWSAcessKey' \
-var 'aws_secret_key=DmAI2PRWkefeBaCQg38qULUYiMH4GtYr3ogjYF4k' \
-var 'build_env=development' \
-var 'logstash_host=logstash.amida.com' \
-var 'service_name=amida_auth_microservice' \
-var 'ami_name=api-auth-service-boilerplate' \
-var 'node_env=development' \
-var 'jwt_secret=0a6b944d-d2fb-46fc-a85e-0295c986cd9f' \
-var 'auth_service_only_admin_can_create_users=false' \
-var 'auth_service_jwt_mode=hmac' \
-var 'auth_service_pg_host=amid-messages-packer-test.czgzedfwgy7z.us-west-2.rds.amazonaws.com' \
-var 'auth_service_pg_db=amida_auth_microservice' \
-var 'auth_service_pg_user=amida_auth_microservice' \
-var 'auth_service_pg_password=somepassword' template.json
```

2. If the validation from `1.` above succeeds, build the image by running the same command but replacing `validate` with `build`
3. In the AWS console you can test the build before deployment. To do this, launch an EC2 instance with the built image and visit the health-check endpoint at <host_address>:4000/api/health-check. Be sure to launch the instance with security groups that allow http access on the app port (currently 4000) and access from Postgres port of the data base. You should see an "OK" response.
4. Enter `aws_access_key` and `aws_secret_key` values in the vars.tf file
5. run `terraform plan` to validate config
6. run `terraform apply` to deploy
7. To get SNS Alarm notifications be sure that you are subscribed to SNS topic arn:aws:sns:us-west-2:844297601570:ops_team_alerts and you have confirmed subscription

### Terraform VPC architecture

![Architecture Diagram](/deploy/Hybrid Cloud Architecture.png?raw=true "Reference Architecture")

`deploy/terraform_vpc` contains additional Terraform files for creating a Virtual Private Cloud (VPC) designed for a 3-tier service.

This configuration is meant as a reference architecture. It creates a VPC with appropriate subnets and ingresses to protect the auth application and the auth database. It will also provision an RDS instance to serve as the database.

While this config provisions a VPC and a multi-AZ RDS instance, the service and load balancing is left up to the deployment implementation.
The second private subnet group should hold an autoscaling group across AZs, while the public subnet should hold an Elastic Load Balancer to the EC2 service instances.
The Bastion jumpbox can be used for debugging and maintenance inside the VPC.

In a deployment with an application using other services, you would want to maintain a similar VPC configuration, while adding other service AMIs to the deployment.

Further details can be found in the `deploy` directory.

## Kubernetes Deployment
See the [paper](https://paper.dropbox.com/doc/Amida-Microservices-Kubernetes-Deployment-Xsz32zX8nwT9qctitGNVc) write-up for instructions on how to deploy with Kubernetes. The `kubernetes.yml` file contains the deployment definition for the project.

# Environment Variables

Environment variables are applied in this order, with the former overwritten by the latter:

1. Default values, which are set automatically by [joi](https://github.com/hapijs/joi) within `config.js`, even if no such environment variable is specified whatsoever.
2. Variables specified by the `.env` file.
3. Variables specified via the command line.

Variables are listed below in this format:

##### `VARIABLE_NAME` (Required (if it actually is)) [`the default value`]

A description of what the variable is or does.
- A description of what to set the variable to, whether that be an example, or what to set it to in development or production, or how to figure out how to set it, etc.
- Perhaps another example value, etc.

## Auth Microservice

##### `NODE_ENV` (Required) [`development`]

- Valid values are `development`, `production`, and `test`.

##### `JWT_SECRET` (Required)

First, see description of `AUTH_SERVICE_JWT_MODE`. When `AUTH_SERVICE_JWT_MODE=hmac`, this is the shared secret between this service an all services using this service for authentication. Therefore, all other such service must set their `JWT_SECRET` to match this value.
- In production, this should be set to a value different than the one in `.env.example`.

##### `AUTH_SERVICE_PORT` (Required) [`4000`]

The port this server will run on.
- When in development, by default set to `4000`, because other Amida microservices run, by default, on other `400x` ports.

##### `AUTH_SERVICE_ONLY_ADMIN_CAN_CREATE_USERS` [`true`]
- When `true`, only a user who has admin privileges/scope can create new users.
- When `false`, anyone can sign up and create a new account.

##### `AUTH_SERVICE_JWT_MODE` (Required) [`hmac`]
- When set to `hmac`, json web tokens will use the shared-secret signing strategy, in which case `JWT_SECRET` needs to be specified on and match between this microservice and all other services that integrate with this microservice.
- When set to `rsa`, json web tokens will use the public/private key pair signing strategy, in which case `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` need to be defined.

##### `AUTH_SERVICE_JWT_PRIVATE_KEY_PATH`

Path on the file system of the JWT private key file.

##### `AUTH_SERVICE_JWT_PUBLIC_KEY_PATH`

Path on the file system of the JWT public key file.

##### `AUTH_SERVICE_JWT_TTL` [`3600`]

Time To Live, in seconds, of the JSON web token.

##### `AUTH_SERVICE_REFRESH_TOKEN_ENABLED` [`false`]

Not fully implemented yet.

##### `AUTH_SERVICE_REFRESH_TOKEN_MULTIPLE_DEVICES` [`false`]

Not fully implemented yet.

##### `AUTH_SERVICE_PG_HOST`

Hostname of machine the postgres instance is running on.
- When using docker, set to the name of the docker container running postgres. Setting to `amida-auth-microservice-db` is recommended.

##### `AUTH_SERVICE_PG_PORT` [`5432`]

Port on the machine the postgres instance is running on.

##### `AUTH_SERVICE_PG_DB`

Postgres database name.
- Setting to `amida_auth_microservice` is recommended because 3rd parties could be running Amida services using their Postgres instances--which is why the name begins with `amida_`.

##### `AUTH_SERVICE_PG_USER`

Postgres user that will perform operations on behalf of this microservice. Therefore, this user must have permissions to modify the database specified by `AUTH_SERVICE_PG_DB`.
- Setting to `amida_auth_microservice` is recommended because 3rd parties could be running Amida services using their Postgres instances--which is why the name begins with `amida_`.

##### `AUTH_SERVICE_PG_PASSWORD`

Password of postgres user `AUTH_SERVICE_PG_USER`.

##### `AUTH_SERVICE_PG_SSL_ENABLED` [`false`]

Whether an SSL connection shall be used to connect to postgres.

##### `AUTH_SERVICE_PG_CA_CERT`

If SSL is enabled with `AUTH_SERVICE_PG_SSL_ENABLED` this can be set to a certificate to override the CAs that are trusted while initiating the SSL connection to postgres. Without this set, Mozilla's list of trusted CAs is used. Note that this variable should contain the certificate itself, not a filename.

## Integration With Facebook for Login

##### `FACEBOOK_CLIENT_ID`

The ID of the Facebook App through which login will occur.

##### `FACEBOOK_CLIENT_SECRET`

The secret of the Facebook App through which login will occur.

##### `FACEBOOK_CALLBACK_URL`

The url of the `amida-auth-microservice` endpoint that handles Facebook auth callback.

## Integration With Mail Service Provider

The mail service provider sends password reset emails when the user clicks the "Forgot your password?" button. Each mail service provider (Gmail, SendGrid, Mailgun, etc.) treats the environment variables slighly differently, therefore examples are provided at the end of this section.

##### `AUTH_SERVICE_MAILER_EMAIL_ID`

The username/email address used to login to the email service provider and send SMTP email.

##### `AUTH_SERVICE_MAILER_PASSWORD`

The password to account specified by `AUTH_SERVICE_MAILER_EMAIL_ID`.

##### `AUTH_SERVICE_MAILER_FROM_EMAIL_ADDRESS`

The email address the password reset emails will come from.

##### `AUTH_SERVICE_MAILER_SERVICE_PROVIDER`

One of the service providers that is supported by nodemailer.
- Recommended values are `Gmail`, `SendGrid`, or `Mailgun`.
- Potentially valid--though not tested or supported--values are
 `126`, `163`, `1und1`, `AOL`, `DebugMail`, `DynectEmail`, `FastMail`, `GandiMail`, `Gmail`, `Godaddy`, `GodaddyAsia`, `GodaddyEurope`, `hot.ee`, `Hotmail`, `iCloud`, `mail.ee`, `Maildev`, `Mailgun`, `Mailjet`, `Mailosaur`, `Mandrill`, `Naver`, `OpenMailBox`, `Outlook365`, `Postmark`, `QQ`, `QQex`, `SendCloud`, `SendGrid`, `SendinBlue`, `SendPulse`, `SES`, `SES-US-EAST-1`, `SES-US-WEST-2`, `SES-EU-WEST-1`, `Sparkpost`, `Yahoo`, `Yandex`, `Zoho`, and `qiye.aliyun`.

### Email Service Provider Config Examples

Gmail:

```
AUTH_SERVICE_MAILER_EMAIL_ID=someone@gmail.com
# Note: Any + appended to the email address will be dropped. That is, Gmail will handle someone+else@gmail.com like someone@gmail.com

AUTH_SERVICE_MAILER_PASSWORD=the_Gmail_password_for_someone@gmail.com

# Gmail ignores this, so comment out or set to empty string ''. The email will always come from the address specified by `AUTH_SERVICE_MAILER_EMAIL_ID`.
# AUTH_SERVICE_MAILER_FROM_EMAIL_ADDRESS

AUTH_SERVICE_MAILER_SERVICE_PROVIDER=Gmail
```

SendGrid:

```
AUTH_SERVICE_MAILER_EMAIL_ID=your_SendGrid_user_id_not_email_address
AUTH_SERVICE_MAILER_PASSWORD=your_SendGrid_password
AUTH_SERVICE_MAILER_FROM_EMAIL_ADDRESS=anything_will_work
AUTH_SERVICE_MAILER_SERVICE_PROVIDER=SendGrid
```

Mailgun:

Mailgun does not allow SMTP login/send with your Mailgun account username/email and password. Instead, in Mailgun, a send/recieve domain must be set up, and with each such domain, Mailgun associates an SMTP email address and password. Therefore, to use Mailgun, you must, with a domain you own, setup that domain to work with mailgun, which includes setting DNS records for that domain in your DNS service provider, and then use the associated SMTP email address and password in this config.

```
# Mailgun sets postmaster@yourdomain.com as the default when you setup your domain in Mailgun. In Mailgun, you can change this to something else if you want.
AUTH_SERVICE_MAILER_EMAIL_ID=postmaster@yourdomain.com
AUTH_SERVICE_MAILER_PASSWORD=SMTP_password_for_your_domain_as_configured_in_Mailgun
AUTH_SERVICE_MAILER_FROM_EMAIL_ADDRESS=anything_will_work
AUTH_SERVICE_MAILER_SERVICE_PROVIDER=Mailgun
```