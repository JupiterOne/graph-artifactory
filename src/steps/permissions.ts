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
import { getRepositoryKey } from './repositories';
import { entities, relationships } from '../constants';

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

async function createPermissionBuildAllowsRelationships(
  jobState: JobState,
  permission: ArtifactoryPermission,
  permissionEntity: Entity,
): Promise<void> {
  return createPermissionBuildRelationship(
    jobState,
    permission,
    permissionEntity,
    {
      _class: RelationshipClass.ALLOWS,
      _type: relationships.PERMISSION_ALLOWS_BUILD._type,
    },
    (buildEntity) => `${permissionEntity._key}|allows|${buildEntity._key}`,
  );
}

async function createPermissionBuildRelationship(
  jobState: JobState,
  permission: ArtifactoryPermission,
  permissionEntity: Entity,
  relationshipTemplate: {
    _type: string;
    _class: RelationshipClass;
  },
  keyGenerator: (buildEntity: Entity) => string,
): Promise<void> {
  const includes = permission.build?.['include-patterns'] || [];
  const excludes = permission.build?.['exclude-patterns'] || [];

  const matchesIncludes = (target: string) =>
    includes.some((pattern) => match(pattern.split('/')[0], target).matches);
  const matchesExcludes = (target: string) =>
    excludes.some((pattern) => match(pattern.split('/')[0], target).matches);

  await jobState.iterateEntities(
    { _type: entities.BUILD._type },
    async (buildEntity) => {
      const [, buildName] = buildEntity._key.split(':');

      if (matchesIncludes(buildName) && !matchesExcludes(buildName)) {
        await jobState.addRelationship(
          createMappedRelationship({
            ...relationshipTemplate,
            _key: keyGenerator(buildEntity),
            source: permissionEntity,
            target: buildEntity,
          }),
        );
      }
    },
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
      const userEntity = await jobState.findEntity(getGroupKey(groupName));

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

    const targetRepositories = permission.repo?.repositories || [];

    for (const targetRepository of targetRepositories) {
      const repositoryEntity = await jobState.findEntity(
        getRepositoryKey(targetRepository),
      );

      if (repositoryEntity) {
        await jobState.addRelationship(
          createMappedRelationship({
            _class: RelationshipClass.ALLOWS,
            _type: relationships.PERMISSION_ALLOWS_REPOSITORY._type,
            _key: `${permissionEntity._key}|allows|${repositoryEntity._key}`,
            source: permissionEntity,
            target: repositoryEntity,
          }),
        );
      }
    }

    await createPermissionBuildAllowsRelationships(
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
    ],
    dependsOn: [
      'fetch-users',
      'fetch-groups',
      'fetch-repositories',
      'fetch-builds',
    ],
    executionHandler: fetchPermissions,
  },
];
