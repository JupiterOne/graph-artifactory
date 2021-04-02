# Integration with JupiterOne

## JFrog Artifactory + JupiterOne Integration Benefits

- Visualize Artifactory repository groups, code repositories, code modules,
  builds, keys, permissions, code modules, user groups, and users in the
  JupiterOne graph.
- Monitor Artifactory CI/CD activities across containers and repositories.
- Monitor Artifactory changes to repository groups, code repositories, code
  modules, builds, keys, permissions, code modules, user groups, and users using
  JupiterOne alerts.

## How it Works

- JupiterOne periodically fetches Artifactory users and data across your CI/CD pipeline to update the graph.
- Write JupiterOne queries to review and monitor updates to the graph.
- Configure alerts to take action when the JupiterOne graph changes.

## Requirements

- JupiterOne requires the namespace of your Artifactory account. Also required are a client access token, 
client pipeline access token, and the client administrator name that granted the access tokens.
- You must have permission in JupiterOne to install new integrations.

## Setup

JupiterOne provides a managed integration for JFrog Artifactory. The integration
connects directly to JFrog Artifactory API to obtain configuration metadata and
analyze resource relationships.

<!-- {J1_DOCUMENTATION_MARKER_START} -->
<!--
********************************************************************************
NOTE: ALL OF THE FOLLOWING DOCUMENTATION IS GENERATED USING THE
"j1-integration document" COMMAND. DO NOT EDIT BY HAND! PLEASE SEE THE DEVELOPER
DOCUMENTATION FOR USAGE INFORMATION:

https://github.com/JupiterOne/sdk/blob/master/docs/integrations/development.md
********************************************************************************
-->

## Data Model

### Entities

The following entities are created:

| Resources          | Entity `_type`                    | Entity `_class`    |
| ------------------ | --------------------------------- | ------------------ |
| AccessToken        | `artifactory_access_token`        | `Key`, `AccessKey` |
| Account            | `artifactory_account`             | `Account`          |
| ArtifactCodeModule | `artifactory_artifact_codemodule` | `CodeModule`       |
| Build              | `artifactory_build`               | `Configuration`    |
| Group              | `artifactory_group`               | `UserGroup`        |
| Permission         | `artifactory_permission`          | `AccessPolicy`     |
| PipelineSource     | `artifactory_pipeline_source`     | `CodeRepo`         |
| Repository         | `artifactory_repository`          | `Repository`       |
| RepositoryGroup    | `artifactory_repository_group`    | `Group`            |
| User               | `artifactory_user`                | `User`             |

### Relationships

The following relationships are created/mapped:

| Source Entity `_type`      | Relationship `_class` | Target Entity `_type`             |
| -------------------------- | --------------------- | --------------------------------- |
| `artifactory_access_token` | **ASSIGNED**          | `artifactory_user`                |
| `artifactory_account`      | **HAS**               | `artifactory_access_token`        |
| `artifactory_account`      | **HAS**               | `artifactory_group`               |
| `artifactory_account`      | **HAS**               | `artifactory_pipeline_source`     |
| `artifactory_account`      | **HAS**               | `artifactory_repository`          |
| `artifactory_account`      | **HAS**               | `artifactory_repository_group`    |
| `artifactory_account`      | **HAS**               | `artifactory_user`                |
| `artifactory_build`        | **CREATED**           | `artifactory_artifact_codemodule` |
| `artifactory_group`        | **HAS**               | `artifactory_user`                |
| `artifactory_permission`   | **ALLOWS**            | `artifactory_build`               |
| `artifactory_permission`   | **ALLOWS**            | `artifactory_repository`          |
| `artifactory_permission`   | **ALLOWS**            | `artifactory_repository_group`    |
| `artifactory_permission`   | **ASSIGNED**          | `artifactory_group`               |
| `artifactory_permission`   | **ASSIGNED**          | `artifactory_user`                |
| `artifactory_repository`   | **HAS**               | `artifactory_artifact_codemodule` |

<!--
********************************************************************************
END OF GENERATED DOCUMENTATION AFTER BELOW MARKER
********************************************************************************
-->
<!-- {J1_DOCUMENTATION_MARKER_END} -->
