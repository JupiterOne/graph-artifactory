import {
  IntegrationStepExecutionContext,
  createIntegrationEntity,
  IntegrationStep,
  createDirectRelationship,
  createMappedRelationship,
  JobState,
  RelationshipClass,
  Entity,
} from '@jupiterone/integration-sdk-core';
import { match } from 'node-match-path';

import { createAPIClient } from '../client';
import { IntegrationConfig, ArtifactoryPermission } from '../types';
import { getUserKey, getGroupKey } from './access';
import { entities, relationships } from '../constants';
import { getRepositoryGroupKey } from './repositories';

type PermissionRules = {
  [rule: string]: boolean;
};

type PermissionsMap = {
  [targetName: string]: {
    permissions: {
      repositoryPermissions?: PermissionRules;
      buildPermissions?: PermissionRules;
    };
  };
};

export function getPermissionKey(permission: ArtifactoryPermission): string {
  return `artifactory_permission:${permission.name}`;
}

function constructPermissions(rules: string[]): PermissionRules {
  return rules.reduce(
    (acc, rule) => ({
      ...acc,
      [rule]: true,
    }),
    {},
  );
}

function constructPermissionsMap(
  permission: ArtifactoryPermission,
  key: 'users' | 'groups',
): PermissionsMap {
  const repoTargets = Object.entries(permission.repo?.actions[key] || {}).map(
    ([targetName, rules]) => ({
      targetName,
      permissions: {
        repositoryPermissions: constructPermissions(rules),
      },
    }),
  );
  const buildTargets = Object.entries(permission.build?.actions[key] || {}).map(
    ([targetName, rules]) => ({
      targetName,
      permissions: {
        buildPermissions: constructPermissions(rules),
      },
    }),
  );

  const targetPermissionsMap: PermissionsMap = {};
  for (const targetPermissions of [...repoTargets, ...buildTargets]) {
    const { targetName, permissions } = targetPermissions;

    const existingUser = targetPermissionsMap[targetName];
    if (existingUser) {
      targetPermissionsMap[targetName] = {
        permissions: {
          ...existingUser.permissions,
          ...permissions,
        },
      };
    } else {
      targetPermissionsMap[targetName] = { permissions };
    }
  }

  return targetPermissionsMap;
}

async function createPermissionRelationship(
  jobState: JobState,
  permission: ArtifactoryPermission,
  permissionEntity: Entity,
  relationshipType: 'build' | 'repo',
  targetType: string,
  relationshipTemplate: {
    _type: string;
    _class: RelationshipClass;
  },
  keyGenerator: (entity: Entity) => string,
): Promise<void> {
  const includes = permission[relationshipType]?.['include-patterns'] || [];
  const excludes = permission[relationshipType]?.['exclude-patterns'] || [];

  const matchesIncludes = (target: string) =>
    includes.some((pattern) => match(pattern.split('/')[0], target).matches);
  const matchesExcludes = (target: string) =>
    excludes.some((pattern) => match(pattern.split('/')[0], target).matches);

  await jobState.iterateEntities({ _type: targetType }, async (entity) => {
    const [, target] = entity._key.split(':');

    if (matchesIncludes(target) && !matchesExcludes(target)) {
      await jobState.addRelationship(
        createMappedRelationship({
          ...relationshipTemplate,
          _key: keyGenerator(entity),
          source: permissionEntity,
          target: entity,
        }),
      );
    }
  });
}

async function createPermissionBuildAllowsRelationships(
  jobState: JobState,
  permission: ArtifactoryPermission,
  permissionEntity: Entity,
): Promise<void> {
  return createPermissionRelationship(
    jobState,
    permission,
    permissionEntity,
    'build',
    entities.BUILD._type,
    {
      _class: RelationshipClass.ALLOWS,
      _type: relationships.PERMISSION_ALLOWS_BUILD._type,
    },
    (buildEntity) => `${permissionEntity._key}|allows|${buildEntity._key}`,
  );
}

async function createPermissionAllowsRepositoryGroupRelationships(
  jobState: JobState,
  permission: ArtifactoryPermission,
  permissionEntity: Entity,
): Promise<void> {
  for (const repositoryName of permission.repo?.repositories || []) {
    if (!['ANY', 'ANY LOCAL', 'ANY REMOTE'].includes(repositoryName)) {
      continue;
    }

    const group = await jobState.findEntity(
      getRepositoryGroupKey(repositoryName),
    );

    if (group) {
      await jobState.addRelationship(
        createMappedRelationship({
          _class: RelationshipClass.ALLOWS,
          _type: relationships.PERMISSION_ALLOWS_REPOSITORY_GROUP._type,
          _key: `${permissionEntity._key}|allows|${group._key}`,
          source: permissionEntity,
          target: group,
        }),
      );
    }
  }
}

async function createPermissionRepositoryAllowsRelationships(
  jobState: JobState,
  permission: ArtifactoryPermission,
  permissionEntity: Entity,
): Promise<void> {
  return createPermissionRelationship(
    jobState,
    permission,
    permissionEntity,
    'repo',
    entities.REPOSITORY._type,
    {
      _class: RelationshipClass.ALLOWS,
      _type: relationships.PERMISSION_ALLOWS_REPOSITORY._type,
    },
    (repositoryEntity) =>
      `${permissionEntity._key}|allows|${repositoryEntity._key}`,
  );
}

export async function fetchPermissions({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await apiClient.iteratePermissions(async (permission) => {
    const permissionEntity = createIntegrationEntity({
      entityData: {
        source: permission,
        assign: {
          _key: getPermissionKey(permission),
          _type: entities.PERMISSION._type,
          _class: entities.PERMISSION._class,
        },
      },
    });

    await jobState.addEntity(permissionEntity);

    // Group permissions
    for (const [groupName, { permissions }] of Object.entries(
      constructPermissionsMap(permission, 'groups'),
    )) {
      const groupEntity = await jobState.findEntity(getGroupKey(groupName));

      if (groupEntity) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.ASSIGNED,
            from: permissionEntity,
            to: groupEntity,
            properties: permissions,
          }),
        );
      }
    }

    // User permissions
    for (const [username, { permissions }] of Object.entries(
      constructPermissionsMap(permission, 'users'),
    )) {
      const userEntity = await jobState.findEntity(getUserKey(username));

      if (userEntity) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.ASSIGNED,
            from: permissionEntity,
            to: userEntity,
            properties: permissions,
          }),
        );
      }
    }

    await createPermissionRepositoryAllowsRelationships(
      jobState,
      permission,
      permissionEntity,
    );

    await createPermissionBuildAllowsRelationships(
      jobState,
      permission,
      permissionEntity,
    );

    await createPermissionAllowsRepositoryGroupRelationships(
      jobState,
      permission,
      permissionEntity,
    );
  });
}

export const permissionsSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-permissions',
    name: 'Fetch Permissions',
    entities: [entities.PERMISSION],
    relationships: [
      relationships.PERMISSION_ASSIGNED_USER,
      relationships.PERMISSION_ASSIGNED_GROUP,
      relationships.PERMISSION_ALLOWS_REPOSITORY,
      relationships.PERMISSION_ALLOWS_BUILD,
      relationships.PERMISSION_ALLOWS_REPOSITORY_GROUP,
    ],
    dependsOn: [
      'fetch-users',
      'generate-repository-groups',
      'fetch-groups',
      'fetch-repositories',
      'fetch-builds',
    ],
    executionHandler: fetchPermissions,
  },
];
