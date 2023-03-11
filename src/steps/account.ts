import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { ACCOUNT_ENTITY_DATA_KEY, entities, Steps } from '../constants';
import { ArtifactoryUsername, IntegrationConfig } from '../types';

export function getAccountKey(name: ArtifactoryUsername): string {
  return `artifactory_account:${name}`;
}

export async function fetchAccountDetails({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

  const account = await apiClient.getAccount();

  const accountEntity = createIntegrationEntity({
    entityData: {
      source: account,
      assign: {
        _key: getAccountKey(account.name),
        _type: entities.ACCOUNT._type,
        _class: entities.ACCOUNT._class,
        webLink: account.uri,
        displayName: instance.name,
        name: instance.name,
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
