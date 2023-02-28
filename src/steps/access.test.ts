import { Steps } from '../constants';
import { buildStepTestConfig } from '../../test/config';
import { executeStepWithDependencies } from '@jupiterone/integration-sdk-testing';
import {
  setupArtifactoryRecording,
  Recording,
} from '../../test/helpers/recording';

let recording: Recording;

afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

describe('fetch-groups', () => {
  test('success', async () => {
    recording = setupArtifactoryRecording({
      name: 'fetch-groups',
      directory: __dirname,
      options: {
        recordFailedRequests: true,
        matchRequestsBy: {
          url: {
            hostname: false,
          },
        },
      },
    });

    const stepConfig = buildStepTestConfig(Steps.GROUPS);
    const stepResults = await executeStepWithDependencies(stepConfig);
    expect(stepResults).toMatchStepMetadata(stepConfig);
  });
});

describe('fetch-access-tokens', () => {
  test('success', async () => {
    recording = setupArtifactoryRecording({
      name: 'fetch-access-tokens',
      directory: __dirname,
      options: {
        recordFailedRequests: true,
        matchRequestsBy: {
          url: {
            hostname: false,
          },
        },
      },
    });

    const stepConfig = buildStepTestConfig(Steps.ACCESS_TOKENS);
    const stepResults = await executeStepWithDependencies(stepConfig);
    expect(stepResults).toMatchStepMetadata(stepConfig);
  });
});

describe('fetch-users', () => {
  test('success', async () => {
    recording = setupArtifactoryRecording({
      name: 'fetch-users',
      directory: __dirname,
      options: {
        recordFailedRequests: true,
        matchRequestsBy: {
          url: {
            hostname: false,
          },
        },
      },
    });

    const stepConfig = buildStepTestConfig(Steps.USERS);
    const stepResults = await executeStepWithDependencies(stepConfig);
    expect(stepResults).toMatchStepMetadata(stepConfig);
  });
});
