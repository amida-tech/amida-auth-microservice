# Changelog

## [Unreleased]
### Changed
- **`yarn test` command changed**
  * `yarn test` command now *only* runs tests. 
  * `yarn jenkins` continues to DB drop and DB create.
  * `.env.test` is now used by Jenkins test (`yarn jenkins`). Previously, config was stored on Jenkins server.
- Babel6 --> 7

### Deprecated
- Env vars 
  * `AUTH_MICROSERVICE_URL`
  * `AUTH_SERVICE_PASSWORD_RESET_PAGE_URL`
  * `AUTH_SERVICE_ONLY_ADMIN_CAN_CREATE_USERS`

### Removed
- gulp3
  * ~5x faster `yarn build` 
  * Identical functionality (`yarn start` for `nodemon`, `yarn clean`, sourcemaps)


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
