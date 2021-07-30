import {
  IntegrationProviderAuthenticationError,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';
import {
  createMockExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';

import { validateInvocation } from './config';
import { IntegrationConfig } from './types';
import { integrationConfig } from '../test/config';
import { setupArtifactoryRecording } from '../test/helpers/recording';

describe('JFrog Arrifactory', () => {
  let recording: Recording;

  afterEach(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  test('requires valid config', async () => {
    const executionContext = createMockExecutionContext<IntegrationConfig>({
      instanceConfig: {} as IntegrationConfig,
    });

    try {
      await validateInvocation(executionContext);
    } catch (e) {
      expect(e instanceof IntegrationValidationError).toBe(true);
    }
  });

  test('auth error - 401', async () => {
    recording = setupArtifactoryRecording({
      directory: __dirname,
      name: 'authError401',
      options: {
        matchRequestsBy: {
          url: {
            hostname: false,
          },
        },
        recordFailedRequests: true,
      },
    });

    const executionContext = createMockExecutionContext({
      instanceConfig: integrationConfig,
    });

    executionContext.instance.config.clientAccessToken = 'badtoken';

    await expect(validateInvocation(executionContext)).rejects.toThrow(
      IntegrationProviderAuthenticationError,
    );
  });

  test('invalid client admin name - 404', async () => {
    recording = setupArtifactoryRecording({
      directory: __dirname,
      name: 'invalidClientAdminName404',
      options: {
        matchRequestsBy: {
          url: {
            hostname: false,
          },
        },
        recordFailedRequests: true,
      },
    });

    const executionContext = createMockExecutionContext({
      instanceConfig: integrationConfig,
    });

    executionContext.instance.config.clientAdminName = 'wrongname@wrong.com';

    await expect(validateInvocation(executionContext)).rejects.toThrow(
      IntegrationValidationError,
    );
  });
});
