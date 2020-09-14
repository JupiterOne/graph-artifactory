# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
