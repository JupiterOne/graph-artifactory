import {
  IntegrationExecutionContext,
  StepStartStates,
} from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from './types';
import { Steps } from './constants';

export default function getStepStartStates(
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
