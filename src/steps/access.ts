import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { Steps } from '../constants';
import { ACCOUNT_ENTITY_DATA_KEY, entities, relationships } from '../constants';
import { IntegrationConfig } from '../types';

export function getUserKey(name: string): string {
  return `artifactory_user:${name}`;
}

export function getGroupKey(name: string): string {
  return `artifactory_group:${name}`;
}

export function getAccessTokenKey(id: string): string {
  return `artifactory_api_token:${id}`;
}

export async function fetchUsers({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

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
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

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

export async function fetchAccessTokens({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

  const accountEntity = (await jobState.getData(
    ACCOUNT_ENTITY_DATA_KEY,
  )) as Entity;

  await apiClient.iterateAccessTokens(async (token) => {
    const tokenEntity = createIntegrationEntity({
      entityData: {
        source: token,
        assign: {
          _key: getAccessTokenKey(token.token_id),
          _type: entities.ACCESS_TOKEN._type,
          _class: entities.ACCESS_TOKEN._class,
          name: token.token_id,
        },
      },
    });

    const [, , username] = token.subject.split('/');

    const userEntity = await jobState.findEntity(getUserKey(username));

    if (userEntity) {
      await Promise.all([
        jobState.addEntity(tokenEntity),
        jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.ASSIGNED,
            from: tokenEntity,
            to: userEntity,
          }),
        ),
      ]);
    } else {
      await Promise.all([
        jobState.addEntity(tokenEntity),
        jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.HAS,
            from: accountEntity,
            to: tokenEntity,
          }),
        ),
      ]);
    }
  });
}

export const accessSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.GROUPS,
    name: 'Fetch Groups',
    entities: [entities.GROUP],
    relationships: [relationships.ACCOUNT_HAS_GROUP],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: fetchGroups,
  },
  {
    id: Steps.ACCESS_TOKENS,
    name: 'Fetch Access Tokens',
    entities: [entities.ACCESS_TOKEN],
    relationships: [
      relationships.ACCOUNT_HAS_ACCESS_TOKEN,
      relationships.ACCESS_TOKEN_ASSIGNED_USER,
    ],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: fetchAccessTokens,
  },
  {
    id: Steps.USERS,
    name: 'Fetch Users',
    entities: [entities.USER],
    relationships: [
      relationships.ACCOUNT_HAS_USER,
      relationships.GROUP_HAS_USER,
    ],
    dependsOn: [Steps.ACCOUNT, Steps.GROUPS],
    executionHandler: fetchUsers,
  },
];
