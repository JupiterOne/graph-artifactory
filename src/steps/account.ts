import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig, ArtifactoryUsername } from '../types';

export const ACCOUNT_ENTITY_KEY = 'entity:account';
export const ACCOUNT_ENTITY_TYPE = 'artifactory_account';

export function getAccountKey(name: ArtifactoryUsername): string {
  return `artifactory_account:${name}`;
}

export async function fetchAccountDetails({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const account = await apiClient.getAccount();

  const accountEntity = createIntegrationEntity({
    entityData: {
      source: account,
      assign: {
        _type: ACCOUNT_ENTITY_TYPE,
        _key: getAccountKey(account.name),
        _class: 'Account',
        webLink: account.uri,
        displayName: account.name,
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
    jobState.setData(ACCOUNT_ENTITY_KEY, accountEntity),
  ]);
}

export const accountSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-account',
    name: 'Fetch Account Details',
    types: [ACCOUNT_ENTITY_TYPE],
    dependsOn: [],
    executionHandler: fetchAccountDetails,
  },
];
