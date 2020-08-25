import {
  RelationshipClass,
  StepEntityMetadata,
  StepRelationshipMetadata,
} from '@jupiterone/integration-sdk-core';

export const ACCOUNT_ENTITY_DATA_KEY = 'entity:account';

type EntityConstantKeys =
  | 'ACCOUNT'
  | 'GROUP'
  | 'REPOSITORY'
  | 'USER'
  | 'ACCESS_TOKEN'
  | 'PIPELINE_SOURCE'
  | 'ARTIFACT_CODEMODULE'
  | 'ARTIFACT_IMAGE'
  | 'BUILD'
  | 'PERMISSION';

export const entities: Record<EntityConstantKeys, StepEntityMetadata> = {
  ACCOUNT: {
    resourceName: 'Account',
    _type: 'artifactory_account',
    _class: 'Account',
  },
  GROUP: {
    resourceName: 'Group',
    _type: 'artifactory_group',
    _class: 'UserGroup',
  },
  REPOSITORY: {
    resourceName: 'Repository',
    _type: 'artifactory_repository',
    _class: 'Repository',
  },
  USER: {
    resourceName: 'User',
    _type: 'artifactory_user',
    _class: 'User',
  },
  ACCESS_TOKEN: {
    resourceName: 'AccessToken',
    _type: 'artifactory_access_token',
    _class: ['Key', 'AccessKey'],
  },
  PIPELINE_SOURCE: {
    resourceName: 'PipelineSource',
    _type: 'artifactory_pipeline_source',
    _class: 'CodeRepo',
  },
  ARTIFACT_CODEMODULE: {
    resourceName: 'ArtifactCodeModule',
    _type: 'artifactory_artifact_codemodule',
    _class: 'CodeModule',
  },
  ARTIFACT_IMAGE: {
    resourceName: 'ArtifactImage',
    _type: 'artifactory_artifact_image',
    _class: 'Image',
  },
  BUILD: {
    resourceName: 'Build',
    _type: 'artifactory_build',
    _class: 'Configuration',
  },
  PERMISSION: {
    resourceName: 'Permission',
    _type: 'artifactory_permission',
    _class: 'AccessPolicy',
  },
};

type RelationshipConstantKeys =
  | 'ACCOUNT_HAS_GROUP'
  | 'ACCOUNT_HAS_REPOSITORY'
  | 'ACCOUNT_HAS_USER'
  | 'ACCOUNT_HAS_ACCESS_TOKEN'
  | 'ACCOUNT_HAS_PIPELINE_SOURCE'
  | 'GROUP_HAS_USER'
  | 'REPOSITORY_HAS_ARTIFACT_CODEMODULE'
  | 'BUILD_CREATED_ARTIFACT_CODEMODULE'
  | 'REPOSITORY_HAS_ARTIFACT_IMAGE'
  | 'BUILD_CREATED_ARTIFACT_IMAGE'
  | 'PERMISSION_ASSIGNED_USER'
  | 'PERMISSION_ASSIGNED_GROUP'
  | 'PERMISSION_ALLOWS_REPOSITORY'
  | 'PERMISSION_ALLOWS_BUILD'
  | 'PERMISSION_DENIES_BUILD';

export const relationships: Record<
  RelationshipConstantKeys,
  StepRelationshipMetadata
> = {
  ACCOUNT_HAS_GROUP: {
    _type: 'artifactory_account_has_group',
    _class: RelationshipClass.HAS,
    sourceType: entities.ACCOUNT._type,
    targetType: entities.GROUP._type,
  },
  ACCOUNT_HAS_REPOSITORY: {
    _type: 'artifactory_account_has_repository',
    _class: RelationshipClass.HAS,
    sourceType: entities.ACCOUNT._type,
    targetType: entities.REPOSITORY._type,
  },
  ACCOUNT_HAS_USER: {
    _type: 'artifactory_account_has_user',
    _class: RelationshipClass.HAS,
    sourceType: entities.ACCOUNT._type,
    targetType: entities.USER._type,
  },
  ACCOUNT_HAS_ACCESS_TOKEN: {
    _type: 'artifactory_account_has_access_token',
    _class: RelationshipClass.HAS,
    sourceType: entities.ACCOUNT._type,
    targetType: entities.ACCESS_TOKEN._type,
  },
  ACCOUNT_HAS_PIPELINE_SOURCE: {
    _type: 'artifactory_account_has_pipeline_source',
    _class: RelationshipClass.HAS,
    sourceType: entities.ACCOUNT._type,
    targetType: entities.PIPELINE_SOURCE._type,
  },
  GROUP_HAS_USER: {
    _type: 'artifactory_group_has_user',
    _class: RelationshipClass.HAS,
    sourceType: entities.GROUP._type,
    targetType: entities.USER._type,
  },
  REPOSITORY_HAS_ARTIFACT_CODEMODULE: {
    _type: 'artifactory_repository_has_artifact_codemodule',
    _class: RelationshipClass.HAS,
    sourceType: entities.REPOSITORY._type,
    targetType: entities.ARTIFACT_CODEMODULE._type,
  },
  BUILD_CREATED_ARTIFACT_CODEMODULE: {
    _type: 'artifactory_build_created_artifact_codemodule',
    _class: RelationshipClass.CREATED,
    sourceType: entities.BUILD._type,
    targetType: entities.ARTIFACT_CODEMODULE._type,
  },
  REPOSITORY_HAS_ARTIFACT_IMAGE: {
    _type: 'artifactory_repository_has_artifact_image',
    _class: RelationshipClass.HAS,
    sourceType: entities.REPOSITORY._type,
    targetType: entities.ARTIFACT_IMAGE._type,
  },
  BUILD_CREATED_ARTIFACT_IMAGE: {
    _type: 'artifactory_build_created_artifact_image',
    _class: RelationshipClass.CREATED,
    sourceType: entities.BUILD._type,
    targetType: entities.ARTIFACT_IMAGE._type,
  },
  PERMISSION_ASSIGNED_USER: {
    _type: 'artifactory_permission_assigned_user',
    _class: RelationshipClass.ASSIGNED,
    sourceType: entities.PERMISSION._type,
    targetType: entities.USER._type,
  },
  PERMISSION_ASSIGNED_GROUP: {
    _type: 'artifactory_permission_assigned_group',
    _class: RelationshipClass.ASSIGNED,
    sourceType: entities.PERMISSION._type,
    targetType: entities.GROUP._type,
  },
  PERMISSION_ALLOWS_REPOSITORY: {
    _type: 'artifactory_permission_allows_repository',
    _class: RelationshipClass.ALLOWS,
    sourceType: entities.PERMISSION._type,
    targetType: entities.REPOSITORY._type,
  },
  PERMISSION_ALLOWS_BUILD: {
    _type: 'artifactory_permission_allows_build',
    _class: RelationshipClass.ALLOWS,
    sourceType: entities.PERMISSION._type,
    targetType: entities.BUILD._type,
  },
  PERMISSION_DENIES_BUILD: {
    _type: 'artifactory_permission_denies_build',
    _class: RelationshipClass.DENIES,
    sourceType: entities.PERMISSION._type,
    targetType: entities.BUILD._type,
  },
};
