import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { ACCOUNT_ENTITY_DATA_KEY, entities, relationships } from '../constants';
import { IntegrationConfig } from '../types';

function getUserKey(name: string): string {
  return `artifactory_user:${name}`;
}

function getGroupKey(name: string): string {
  return `artifactory_group:${name}`;
}

export async function fetchUsers({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(
    ACCOUNT_ENTITY_DATA_KEY,
  )) as Entity;

  await apiClient.iterateUsers(async (user) => {
    const userEntity = createIntegrationEntity({
      entityData: {
        source: user,
        assign: {
          _key: getUserKey(user.name),
          _type: entities.USER._type,
          _class: entities.USER._class,
          webLink: user.uri,
          displayName: user.name,
          username: user.name,
          email: user.email,
          policyManager: user.policyManager,
          watchManager: user.watchManager,
          reportsManager: user.reportsManager,
          profileUpdatable: user.profileUpdatable,
          internalPasswordDisable: user.internalPasswordDisabled,
          realm: user.realm,
          disableUIAccess: user.disableUIAccess,
          mfaStatus: user.mfaStatus !== 'NONE',
        },
      },
    });

    if (user.groups) {
      for (const groupName of user.groups) {
        const groupEntity = await jobState.findEntity(getGroupKey(groupName));
        if (groupEntity) {
          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: groupEntity,
              to: userEntity,
            }),
          );
        }
      }
    }

    await Promise.all([
      jobState.addEntity(userEntity),
      jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: accountEntity,
          to: userEntity,
        }),
      ),
    ]);
  });
}

export async function fetchGroups({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(
    ACCOUNT_ENTITY_DATA_KEY,
  )) as Entity;

  await apiClient.iterateGroups(async (group) => {
    const groupEntity = createIntegrationEntity({
      entityData: {
        source: group,
        assign: {
          _key: getGroupKey(group.name),
          _type: entities.GROUP._type,
          _class: entities.GROUP._class,
          webLink: group.uri,
          displayName: group.name,
          name: group.name,
          description: group.description,
          autoJoin: group.autoJoin,
          adminPrivileges: group.adminPrivileges,
          realm: group.realm,
          realmAttributes: group.realmAttributes,
          policyManager: group.policyManager,
          watchManager: group.watchManager,
          reportsManager: group.reportsManager,
        },
      },
    });

    await Promise.all([
      jobState.addEntity(groupEntity),
      jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: accountEntity,
          to: groupEntity,
        }),
      ),
    ]);
  });
}

export const accessSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-groups',
    name: 'Fetch Groups',
    entities: [entities.GROUP],
    relationships: [relationships.ACCOUNT_HAS_GROUP],
    dependsOn: ['fetch-account'],
    executionHandler: fetchGroups,
  },
  {
    id: 'fetch-users',
    name: 'Fetch Users',
    entities: [entities.USER],
    relationships: [
      relationships.ACCOUNT_HAS_USER,
      relationships.GROUP_HAS_USER,
    ],
    dependsOn: ['fetch-account', 'fetch-groups'],
    executionHandler: fetchUsers,
  },
];
