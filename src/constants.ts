import {
  RelationshipClass,
  StepEntityMetadata,
  StepRelationshipMetadata,
} from '@jupiterone/integration-sdk-core';

export const ACCOUNT_ENTITY_DATA_KEY = 'entity:account';

type EntityConstantKeys = 'ACCOUNT' | 'GROUP' | 'REPOSITORY' | 'USER';

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
};

type RelationshipConstantKeys =
  | 'ACCOUNT_HAS_GROUP'
  | 'ACCOUNT_HAS_REPOSITORY'
  | 'ACCOUNT_HAS_USER'
  | 'GROUP_HAS_USER';

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
  GROUP_HAS_USER: {
    _type: 'artifactory_group_has_user',
    _class: RelationshipClass.HAS,
    sourceType: entities.GROUP._type,
    targetType: entities.USER._type,
  },
};
