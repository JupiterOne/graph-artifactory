import {
  createIntegrationEntity,
  Entity,
  IntegrationInstance,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { ACCOUNT_ENTITY_DATA_KEY, entities, Steps } from '../constants';
import { ArtifactoryUser, IntegrationConfig } from '../types';

export function getAccountKey(name: string): string {
  return `artifactory_account:${name}`;
}

function createAccountEntity(account: ArtifactoryUser) {
  return createIntegrationEntity({
    entityData: {
      source: account,
      assign: {
        _key: getAccountKey(account.name),
        _type: entities.ACCOUNT._type,
        _class: entities.ACCOUNT._class,
        webLink: account.uri,
        displayName: account.name,
        name: account.name,
        username: account.name,
        email: account.email,
        policyManager: account.policyManager,
        watchManager: account.watchManager,
        reportsManager: account.reportsManager,
        profileUpdatable: account.profileUpdatable,
        internalPasswordDisable: account.internalPasswordDisabled,
        realm: account.realm,
        disableUIAccess: account.disableUIAccess,
        mfaStatus: account.mfaStatus !== 'NONE',
      },
    },
  });
}

function createBasicAccountEntity(instance: IntegrationInstance) {
  return createIntegrationEntity({
    entityData: {
      source: {},
      assign: {
        _key: getAccountKey(instance.id),
        _type: entities.ACCOUNT._type,
        _class: entities.ACCOUNT._class,
        name: instance.name,
        displayName: instance.name,
        description: instance.description,
      },
    },
  });
}

export async function fetchAccountDetails({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

  let accountEntity: Entity;
  if (!instance.config.clientAdminName) {
    // When the client admin name is not provided, we create a basic account entity
    accountEntity = createBasicAccountEntity(instance);
  } else {
    try {
      const account = await apiClient.getAccount();
      accountEntity = createAccountEntity(account);
    } catch (err) {
      if (err.status === 403) {
        logger.warn(
          'Account details not available due to insufficient permissions, creating basic account entity.',
        );
        accountEntity = createBasicAccountEntity(instance);
      } else {
        throw err;
      }
    }
  }

  await Promise.all([
    jobState.addEntity(accountEntity),
    jobState.setData(ACCOUNT_ENTITY_DATA_KEY, accountEntity),
  ]);
}

export const accountSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.ACCOUNT,
    name: 'Fetch Account Details',
    entities: [entities.ACCOUNT],
    relationships: [],
    dependsOn: [],
    executionHandler: fetchAccountDetails,
  },
];
