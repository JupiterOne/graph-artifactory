import * as dotenv from 'dotenv';
import * as path from 'path';
import { IntegrationConfig } from '../src/types';
import { StepTestConfig } from '@jupiterone/integration-sdk-testing';
import { invocationConfig } from '../src';
import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}

export function buildStepTestConfig(stepId: string): StepTestConfig {
  return {
    stepId,
    instanceConfig: integrationConfig,
    invocationConfig: invocationConfig as IntegrationInvocationConfig,
  };
}

export const integrationConfig: IntegrationConfig = {
  clientNamespace: process.env.CLIENT_NAMESPACE || 'rymvym',
  clientAccessToken: process.env.CLIENT_ACCESS_TOKEN || 'rymvym',
  enablePipelineIngestion: true,
  clientPipelineAccessToken:
    process.env.CLIENT_PIPELINE_ACCESS_TOKEN || 'codeworkr',
  clientAdminName:
    process.env.CLIENT_ADMIN_NAME || '35mgu7ai3q@happy2023year.com',
};

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}
