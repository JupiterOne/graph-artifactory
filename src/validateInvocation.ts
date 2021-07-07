import {
  IntegrationExecutionContext,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from './client';
import { IntegrationConfig } from './types';

export default async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  console.log(context.instance.config);
  const config = sanitizeConfig(context.instance.config);
  console.log(config);

  if (
    !config.clientNamespace ||
    !config.clientAccessToken ||
    !config.clientAdminName
  ) {
    throw new IntegrationValidationError(
      'Config requires all of {clientNamespace, clientAccessToken, clientAdminName}',
    );
  }
  console.log(config.clientPipelineAccessToken);
  const apiClient = createAPIClient(config);
  await apiClient.verifyAuthentication();

  //Check pipeline authentication if it is enabled
  if (config.enablePipelineIngestion) {
    await apiClient.verifyPipelineAuthentication();
  }
}

export function sanitizeConfig(config) {
  if (!config.enablePipelineIngestion) {
    config.clientPipelineAccessToken = 'NOT_USED';
  } else {
    config.clientPipelineAccessToken = process.env.CLIENT_PIPELINE_ACCESS_TOKEN;
  }
  return config;
}
