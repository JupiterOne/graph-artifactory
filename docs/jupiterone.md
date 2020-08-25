# Integration with JupiterOne

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
| Account            | `artifactory_account`             | `Account`          |
| AccessToken        | `artifactory_access_token`        | `Key`, `AccessKey` |
| Group              | `artifactory_group`               | `UserGroup`        |
| User               | `artifactory_user`                | `User`             |
| Repository         | `artifactory_repository`          | `Repository`       |
| ArtifactCodeModule | `artifactory_artifact_codemodule` | `CodeModule`       |
| ArtifactImage      | `artifactory_artifact_image`      | `Image`            |
| Build              | `artifactory_build`               | `Configuration`    |
| Permission         | `artifactory_permission`          | `AccessPolicy`     |
| PipelineSource     | `artifactory_pipeline_source`     | `CodeRepo`         |

### Relationships

The following relationships are created/mapped:

| Source Entity `_type`    | Relationship `_class` | Target Entity `_type`             |
| ------------------------ | --------------------- | --------------------------------- |
| `artifactory_account`    | **HAS**               | `artifactory_access_token`        |
| `artifactory_account`    | **HAS**               | `artifactory_group`               |
| `artifactory_account`    | **HAS**               | `artifactory_user`                |
| `artifactory_group`      | **HAS**               | `artifactory_user`                |
| `artifactory_account`    | **HAS**               | `artifactory_repository`          |
| `artifactory_repository` | **HAS**               | `artifactory_artifact_codemodule` |
| `artifactory_repository` | **HAS**               | `artifactory_artifact_image`      |
| `artifactory_build`      | **CREATED**           | `artifactory_artifact_codemodule` |
| `artifactory_build`      | **CREATED**           | `artifactory_artifact_image`      |
| `artifactory_permission` | **ASSIGNED**          | `artifactory_user`                |
| `artifactory_permission` | **ASSIGNED**          | `artifactory_group`               |
| `artifactory_permission` | **ALLOWS**            | `artifactory_repository`          |
| `artifactory_permission` | **ALLOWS**            | `artifactory_build`               |
| `artifactory_permission` | **DENIES**            | `artifactory_build`               |
| `artifactory_account`    | **HAS**               | `artifactory_pipeline_source`     |

<!--
********************************************************************************
END OF GENERATED DOCUMENTATION AFTER BELOW MARKER
********************************************************************************
-->
<!-- {J1_DOCUMENTATION_MARKER_END} -->
