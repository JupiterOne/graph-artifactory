# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 3.2.0 - 2024-05-15

### Added

- added disableTlsVerification config field

## 3.1.0 - 2024-04-25

### Changed

- change verify authentication to not use admin endpoint

## 3.0.0 - 2024-02-06

### Added

- Added `baseUrl` config option.

### Removed

- Removed `clientNamespace` config option.

## 2.0.3. - 2023-12-27

### Changed

- change duplicate log to debug level

## 2.0.2. - 2023-10-12

### Changed

- Remove prepack command

## 2.0.1 - 2023-10-12

### Fixed

- Updated tsconfig to fix build issues

## 2.0.0 - 2023-03-28

### Changed

- Update SDK dependencies
- Update workflows

### Added

- Added workflow to Dockerize the integration

## 1.3.1 - 2023-03-27

### Changed

- Add duplicate report log for artifact entities.

## 1.3.0 - 2023-03-27

### Changed

- Changed API used to fetch artifacts from Jfrog Artifactory.
- Added new fields to `artifactory_artifact_codemodule` entity.

## 1.2.1 - 2023-03-16

### Changed

- Optimize fetch artifacts client for better memory handling.

## 1.2.0 - 2023-03-13

### Changed

- Added error / timeout handling and optimizations to fetch artifacts step
- Updated sdk packages

## 1.1.0 - 2022-10-13

### Changed

- Changed `Account` entity `displayName` and `name` to `instance.name` value.

## 1.0.2 - 2021-07-30

### Changed

- Updated to throw `IntegrationValidationError` for when a `404` is recieved
  during validate invocation to display useful error message to the user. Added
  tests and recordings for this invalid user response.

## 1.0.1 - 2021-07-30

### Changed

- Updated the validate invocation to hit the `User Detail` endpoint, using the
  provided `clientAdminName`. If a `404` is recieved it means the user is
  invalid and an error should be displayed to user. This is a fatal error
  because several other steps rely on this username to be valid.

## 1.0.0 - 2021-07-19

### Changed

- Upgraded SDK packages and some coding patterns
- Changed `CodeRepo.{id, createdBy, updatedBy}` from `number` to `string` to
  meet data-model schema requirements

## 0.1.5 - 2021-07-09

### Changed

- Updated the error message to display to the customer when {clientAdminName} is
  not found as a user.

### 0.1.4 - 2021-07-08

### Changed

- This integration required the ingestion of pipeline sources. This caused
  issues in cases where pipelines weren't being used. This change was to make
  the pipeline ingestion optional and to disable the step if not explicityly
  enabled.

### 0.1.3 - 2020-12-01

### Fixed

- This integration requires _two_ distinct access tokens. Fixed an issue where
  the pipeline access token was not being validated for this integration,
  causing `UNEXPECTED_ERROR` in the `fetch-pipeline-sources` step.

## 0.1.2 - 2020-09-16

### Fixed

- Fixed an issue where permission properties were objects, failing graph
  validation.
- Fixed an issue where permission->build and permission->repo relationships were
  created as mapped instead of direct relationships and failed persister
  validation.

## 0.1.0 - 2020-08-17

### Added

- Collection of identity and access
- Collection of repositories
- Integration setup documentation
