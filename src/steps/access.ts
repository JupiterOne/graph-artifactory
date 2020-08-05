import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  generateRelationshipType,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';
import { createAPIClient } from '../client';
import { IntegrationConfig } from '../types';
import { ACCOUNT_ENTITY_KEY, ACCOUNT_ENTITY_TYPE } from './account';

const USER_ENTITY_TYPE = 'artifactory_user';
const GROUP_ENTITY_TYPE = 'artifactory_group';

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

  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateUsers(async (user) => {
    const userEntity = createIntegrationEntity({
      entityData: {
        source: user,
        assign: {
          _type: USER_ENTITY_TYPE,
          _key: getUserKey(user.name),
          _class: 'User',
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
        const groupEntity = await jobState.getEntity({
          _key: getGroupKey(groupName),
          _type: GROUP_ENTITY_TYPE,
        });

        await jobState.addRelationship(
          createDirectRelationship({
            _class: 'HAS',
            from: groupEntity,
            to: userEntity,
          }),
        );
      }
    }

    await Promise.all([
      jobState.addEntity(userEntity),
      jobState.addRelationship(
        createDirectRelationship({
          _class: 'HAS',
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

  const accountEntity = (await jobState.getData(ACCOUNT_ENTITY_KEY)) as Entity;

  await apiClient.iterateGroups(async (group) => {
    const groupEntity = createIntegrationEntity({
      entityData: {
        source: group,
        assign: {
          _type: GROUP_ENTITY_TYPE,
          _key: getGroupKey(group.name),
          _class: 'Group',
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
          _class: 'HAS',
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
    types: [
      GROUP_ENTITY_TYPE,
      generateRelationshipType('HAS', ACCOUNT_ENTITY_TYPE, GROUP_ENTITY_TYPE),
    ],
    dependsOn: ['fetch-account'],
    executionHandler: fetchGroups,
  },
  {
    id: 'fetch-users',
    name: 'Fetch Users',
    types: [
      USER_ENTITY_TYPE,
      generateRelationshipType('HAS', ACCOUNT_ENTITY_TYPE, USER_ENTITY_TYPE),
      generateRelationshipType('HAS', GROUP_ENTITY_TYPE, USER_ENTITY_TYPE),
    ],
    dependsOn: ['fetch-account', 'fetch-groups'],
    executionHandler: fetchUsers,
  },
];
