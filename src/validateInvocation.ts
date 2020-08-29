import {
  IntegrationExecutionContext,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from './client';
import { IntegrationConfig } from './types';

export default async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const { config } = context.instance;

  if (
    !config.clientNamespace ||
    !config.clientAccessToken ||
    !config.clientAdminName
  ) {
    throw new IntegrationValidationError(
      'Config requires all of {clientNamespace, clientAccessToken, clientAdminName}',
    );
  }

  const apiClient = createAPIClient(config);

  await apiClient.verifyAuthentication();
}
