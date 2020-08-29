# Integration with JupiterOne

## Setup

JupiterOne provides a managed integration for JFrog Artifactory. The integration
connects directly to JFrog Artifactory API to obtain configuration metadata and
analyze resource relationships.

### Entities

The following entities are ingested from the integration:

| Resources  | \_type of the Entity | \_class of the Entity |
| ---------- | -------------------- | --------------------- |
| Account    | `jfrog_account`      | `Account`             |
| User       | `jfrog_user`         | `User`                |
| Group      | `jfrog_group`        | `Group`               |
| Repository | `jfrog_repository`   | `Repository`          |

### Relationships

The following relationships are created/mapped:

| From            | Edge    | To                 |
| --------------- | ------- | ------------------ |
| `jfrog_account` | **HAS** | `jfrog_user`       |
| `jfrog_account` | **HAS** | `jfrog_group`      |
| `jfrog_group`   | **HAS** | `jfrog_user`       |
| `jfrog_account` | **HAS** | `jfrog_repository` |
