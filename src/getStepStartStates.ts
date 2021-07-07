import {
  IntegrationExecutionContext,
  StepStartStates,
} from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from './types';

export default function getStepStartStates(
  context: IntegrationExecutionContext<IntegrationConfig>,
): StepStartStates {
  const { config } = context.instance;

  return {
    'fetch-groups': {
      disabled: false,
    },
    'fetch-access-tokens': {
      disabled: false,
    },
    'fetch-users': {
      disabled: false,
    },
    'fetch-account': {
      disabled: false,
    },
    'fetch-builds': {
      disabled: false,
    },
    'fetch-permissions': {
      disabled: false,
    },
    'fetch-pipeline-sources': {
      disabled: !config.enablePipelineIngestion,
    },
    'fetch-repositories': {
      disabled: false,
    },
    'generate-repository-groups': {
      disabled: false,
    },
    'fetch-artifacts': {
      disabled: false,
    },
  };
}
