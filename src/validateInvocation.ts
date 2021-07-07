import {
  IntegrationExecutionContext,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from './client';
import { IntegrationConfig } from './types';

export default async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const config = sanitizeConfig(context.instance.config);

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

  if (config.enablePipelineIngestion) {
    await apiClient.verifyPipelineAuthentication();
  }
}

export function sanitizeConfig(config) {
  // Pipeline ingestion is optional which means the token may or may not exist.
  // This function will check to see if it is enabled and assign the token to
  // the config.
  const token = process.env.CLIENT_PIPELINE_ACCESS_TOKEN;
  if (token && config.enablePipelineIngestion) {
    config.clientPipelineAccessToken = token;
  } else if (!token && config.enablePipelineIngestion) {
    throw new IntegrationValidationError(
      'Pipeline Ingestion Enabled: Config requires {clientPipelineAccessToken}',
    );
  }
  return config;
}
