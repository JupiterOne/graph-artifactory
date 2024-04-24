import {
  IntegrationStepExecutionContext,
  createIntegrationEntity,
  IntegrationStep,
  createDirectRelationship,
  JobState,
  RelationshipClass,
  Entity,
} from '@jupiterone/integration-sdk-core';
import { match } from 'node-match-path';

import { createAPIClient } from '../client';
import { IntegrationConfig, ArtifactoryPermission } from '../types';
import { getUserKey, getGroupKey } from './access';
import { entities, IngestionSources, relationships, Steps } from '../constants';
import { getRepositoryGroupKey } from './repositories';

/** Relationships cannot have array or object properties, so permissions are stored as primitives.
 *
 * { user1: { 'permission:build:read': true, 'permission:repo:write': true } }
 */
type PermissionsMap = {
  [targetName: string]: {
    [permissionName: string]: true;
  };
};

export function getPermissionKey(permission: ArtifactoryPermission): string {
  return `artifactory_permission:${permission.name}`;
}

export function constructPermissionsMap(
  permission: ArtifactoryPermission,
  key: 'users' | 'groups',
): PermissionsMap {
  const repoTargets = Object.entries(permission.repo?.actions[key] || {}).map(
    ([targetName, rules]) => ({
      targetName,
      permissions: rules.map((rule) => `repository:${rule}`),
    }),
  );
  const buildTargets = Object.entries(permission.build?.actions[key] || {}).map(
    ([targetName, rules]) => ({
      targetName,
      permissions: rules.map((rule) => `build:${rule}`),
    }),
  );

  const targetPermissionsMap: PermissionsMap = {};
  for (const targetPermissions of [...repoTargets, ...buildTargets]) {
    const { targetName, permissions } = targetPermissions;

    const existingUser = targetPermissionsMap[targetName];
    if (!existingUser) {
      targetPermissionsMap[targetName] = {};
    }

    for (const permission of permissions) {
      targetPermissionsMap[targetName][`permission:${permission}`] = true;
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
        createDirectRelationship({
          _class: relationshipTemplate._class,
          from: permissionEntity,
          to: entity,
          properties: {
            _type: relationshipTemplate._type,
          },
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
        createDirectRelationship({
          _class: RelationshipClass.ALLOWS,
          from: permissionEntity,
          to: group,
          properties: {
            _type: relationships.PERMISSION_ALLOWS_REPOSITORY_GROUP._type,
            _key: `${permissionEntity._key}|allows|${group._key}`,
          },
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
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

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
    for (const [groupName, permissions] of Object.entries(
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
    for (const [username, permissions] of Object.entries(
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
    id: Steps.PERMISSIONS,
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
      Steps.USERS,
      Steps.GENERATE_REPOSITORY_GROUPS,
      Steps.GROUPS,
      Steps.REPOSITORIES,
      Steps.BUILDS,
    ],
    ingestionSourceId: IngestionSources.PERMISSIONS,
    executionHandler: fetchPermissions,
  },
];
