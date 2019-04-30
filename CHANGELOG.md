# Changelog

## [Unreleased]
### Added
- ENV `ALWAYS_INCLUDE_ERROR_STACKS` to include full error stack, including any causal errors.
  * Use with caution in production, because the full stack could leak sensitive information.

### Fixed
- `auth.controller.js:login()` no longer throws duplicate errors for incorrect username or password
- Use error handling middlware `winstonInstance.info(err)`
  * Previously, `winstonInstance.errorLogger()` always threw a `TypeError`, meaning the underlying error didn't actually show in the logs
- `class:APIError` supports full stack traces, including causal errors.
- Update `npm:winston` to `^3.2.1` and `npm:winston-json-formatter` to `^0.10.0` for logging bug fixes and formatting features (see https://github.com/amida-tech/winston-json-formatter/pull/5).
  * Logs "operational errors" at the `warn` level and "programmer errors" at the `error` level.

## [2.7.0] -- 2019-02-04
### Added
- Prepush githook for `yarn lint` and `yarn test` with `npm:husky`

### Changed
- `yarn test` command changed to _only_ run tests
  * `yarn jenkins` includes DB creation, migrations, etc.
- ENV `AUTH_SERVICE_SEED_ADMIN_PASSWORD`, max char 30 --> 512 (DB constraint from `src/db/migrations/20180904132710-create-user.js`)
- Refactor sequelize in `./src/db/`
- Babel6 --> 7
- Update `package.json:engines`
- Update `docker-compose.yml` including postgres 9.4.11 --> 9.6

### Removed
- gulp3
  * ~5x faster `yarn build` 
  * Identical functionality (`yarn start` for `nodemon`, `yarn clean`, sourcemaps)
- ENV vars
  * `AUTH_MICROSERVICE_URL`
  * `AUTH_SERVICE_PASSWORD_RESET_PAGE_URL`
  * `AUTH_SERVICE_ONLY_ADMIN_CAN_CREATE_USERS`


## [2.6.0] -- 2018-12-12
### Added
- Consolidated logging with `npm:winston-json-formatter`.

### Changed
- Seed admin user will get password `AUTH_SERVICE_SEED_ADMIN_PASSWORD` if specified; otherwise it will be auto-generated and logged to stdout when that user is created.
- Password reset URL in reset password request, rather than as an env var.
- DEVOPS-365 related Dockerfile improvements.
- Jenkins tests now use `.env.test`.

### Fixed
- Seed scripts on Windows.
- Broken tests.

### Removed
- Config ENV VAR
  * `AUTH_MICROSERVICE_URL`.
  * `AUTH_SERVICE_ONLY_ADMIN_CAN_CREATE_USERS`.
  * `PASSWORD_RESET_PAGE_URL`. (Password reset URL in reset password request, rather than as an env var.)

### Security
- Fixed some dependency vulnerabilities.
