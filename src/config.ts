import {
  IntegrationExecutionContext,
  IntegrationInstanceConfigFieldMap,
  IntegrationValidationError,
  StepStartStates,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from './client';
import { Steps } from './constants';
import { IntegrationConfig } from './types';

/**
 * A type describing the configuration fields required to execute the
 * integration for a specific account in the data provider.
 *
 * When executing the integration in a development environment, these values may
 * be provided in a `.env` file with environment variables. For example:
 *
 * - `CLIENT_ID=123` becomes `instance.config.clientId = '123'`
 * - `CLIENT_SECRET=abc` becomes `instance.config.clientSecret = 'abc'`
 *
 * Environment variables are NOT used when the integration is executing in a
 * managed environment. For example, in JupiterOne, users configure
 * `instance.config` in a UI.
 */
export const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  clientAccessToken: {
    type: 'string',
    mask: true,
  },
  enablePipelineIngestion: {
    type: 'boolean',
  },
  clientPipelineAccessToken: {
    type: 'string',
    mask: true,
  },
  clientAdminName: {
    type: 'string',
  },
  baseUrl: {
    type: 'string',
  },
};

export async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const { config } = context.instance;

  if (!config.baseUrl || !config.clientAccessToken || !config.clientAdminName) {
    throw new IntegrationValidationError(
      'Config requires all of {baseUrl, clientAccessToken, clientAdminName}',
    );
  }

  const apiClient = createAPIClient(context.logger, config);
  await apiClient.verifyAuthentication();

  if (config.enablePipelineIngestion) {
    await apiClient.verifyPipelineAuthentication();
  }
}

export function getStepStartStates(
  context: IntegrationExecutionContext<IntegrationConfig>,
): StepStartStates {
  const { config } = context.instance;

  return {
    [Steps.GROUPS]: {
      disabled: false,
    },
    [Steps.ACCESS_TOKENS]: {
      disabled: false,
    },
    [Steps.USERS]: {
      disabled: false,
    },
    [Steps.ACCOUNT]: {
      disabled: false,
    },
    [Steps.BUILDS]: {
      disabled: false,
    },
    [Steps.PERMISSIONS]: {
      disabled: false,
    },
    [Steps.PIPELINE_SOURCES]: {
      disabled: !config.enablePipelineIngestion,
    },
    [Steps.REPOSITORIES]: {
      disabled: false,
    },
    [Steps.GENERATE_REPOSITORY_GROUPS]: {
      disabled: false,
    },
    [Steps.ARTIFACTS]: {
      disabled: false,
    },
  };
}
