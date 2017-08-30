# Amida Auth Microservice

// TODO add badges!

## Design

### Integration with other services

In order to use the auth microservice with other applications, you will need to protect your API resources with a JWT strategy. The easiest way to do this is with [Passport JWT](https://www.npmjs.com/package/passport-jwt), which is what this repository uses for its own protected resources. For direct examples of how we set up the strategy, take a look at [passport.js](./config/passport.js), [express.js](./config/express.js), and [auth.route.js](./server/routes/auth.route.js).

In general, the authentication flow will be as follows:
1. `POST /login` with username and password to get a token.
2. Send the JWT in a header `Authorization: Bearer <JWT>` when using a protected resource.

It is the responsibility of the integrated service to extract the JWT, verify it against a shared secret or public/private key pair, and use it to fetch information on the authenticated User.
For example, one API endpoint could allow _any_ authenticated user to view certain information about all users. Another endpoint may allow password updates, but only for the specific authenticated user. It is up to the developer to ensure that endpoints are protected appropriately.

#### Roles
// TODO

### API Spec

### Features

| Feature                                | Summary                                                                                                                                                                                                                                                     |
|----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| ES6 via Babel                  	 	 | ES6 support using [Babel](https://babeljs.io/).  |
| Code Linting               			 | Linting with [eslint](https://www.npmjs.com/package/eslint)                                                                                            |
| Auto server restart                  	 | Restart the server using [nodemon](https://github.com/remy/nodemon) in real-time anytime an edit is made, with babel compilation and eslint.                                                                                                                                                                            |
| ES6 Code Coverage via [istanbul](https://www.npmjs.com/package/istanbul)                  | Supports code coverage of ES6 code using istanbul and mocha. Code coverage reports are saved in `coverage/` directory post `yarn test` execution. Open `coverage/lcov-report/index.html` to view coverage report. `yarn test` also displays code coverage summary on console. Code coverage can also be enforced overall and per file as well, configured via .istanbul.yml                                                                                                                                                                            |
| Debugging via [debug](https://www.npmjs.com/package/debug)           | Instead of inserting and deleting console.log you can replace it with the debug function and just leave it there. You can then selectively debug portions of your code by setting DEBUG env variable. If DEBUG env variable is not set, nothing is displayed to the console.                       |
| Promisified Code via [bluebird](https://github.com/petkaantonov/bluebird)           | We love promise, don't we ? All our code is promisified and even so our tests via [supertest-as-promised](https://www.npmjs.com/package/supertest-as-promised).                       |
| API parameter validation via [express-validation](https://www.npmjs.com/package/express-validation)           | Validate body, params, query, headers and cookies of a request (via middleware) and return a response with errors; if any of the configured validation rules fail. You won't anymore need to make your route handler dirty with such validations. |
| Pre-commit hooks           | Runs lint and tests before any commit is made locally, making sure that only tested and quality code is committed
| Secure app via [helmet](https://github.com/helmetjs/helmet)           | Helmet helps secure Express apps by setting various HTTP headers. |
| Uses [yarn](https://yarnpkg.com) over npm            | Uses new released yarn package manager by facebook. You can read more about it [here](https://code.facebook.com/posts/1840075619545360) |

- CORS support via [cors](https://github.com/expressjs/cors)
- Uses [http-status](https://www.npmjs.com/package/http-status) to set http status code. It is recommended to use `httpStatus.INTERNAL_SERVER_ERROR` instead of directly using `500` when setting status code.
- Has `.editorconfig` which helps developers define and maintain consistent coding styles between different editors and IDEs.

## Developing locally

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
The basic steps for deploying to AWS are:
1. Run the Packer script, `template.json`
2. Run the Terraform script.

Further details can be found in the `deploy` directory.

### Docker deployment
Docker Compose:
```sh
docker-compose up
```

## Logging

Universal logging library [winston](https://www.npmjs.com/package/winston) is used for logging. It has support for multiple transports. A transport is essentially a storage device for your logs. Each instance of a winston logger can have multiple transports configured at different levels. For example, one may want error logs to be stored in a persistent remote location (like a database), but all logs output to the console or a local file. We just log to the console for simplicity, but you can configure more transports as per your requirement.