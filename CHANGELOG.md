# Changelog

## [Unreleased]

### Changed
- Babel6 --> 7
- `.env.test` used by Jenkins test. Previously, config was stoed on Jenkins server.

### Deprecated
- Env vars 
  * `AUTH_MICROSERVICE_URL`
  * `AUTH_SERVICE_PASSWORD_RESET_PAGE_URL`
  * `AUTH_SERVICE_ONLY_ADMIN_CAN_CREATE_USERS`

### Removed
- gulp3
  * ~5x faster `yarn build` 
  * Identical functionality (`yarn start` for `nodemon`, `yarn clean`, sourcemaps)
