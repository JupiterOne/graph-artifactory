# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
