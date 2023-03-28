import { Steps } from '../../constants';
import { buildStepTestConfig } from '../../../test/config';
import { executeStepWithDependencies } from '@jupiterone/integration-sdk-testing';
import {
  setupArtifactoryRecording,
  Recording,
} from '../../../test/helpers/recording';

let recording: Recording;

afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

describe('fetch-repositories', () => {
  test('success', async () => {
    recording = setupArtifactoryRecording({
      name: 'fetch-repositories',
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

    const stepConfig = buildStepTestConfig(Steps.REPOSITORIES);
    const stepResults = await executeStepWithDependencies(stepConfig);
    expect(stepResults).toMatchStepMetadata(stepConfig);
  });
});

describe('generate-repository-groups', () => {
  test('success', async () => {
    recording = setupArtifactoryRecording({
      name: 'generate-repository-groups',
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

    const stepConfig = buildStepTestConfig(Steps.GENERATE_REPOSITORY_GROUPS);
    const stepResults = await executeStepWithDependencies(stepConfig);
    expect(stepResults).toMatchStepMetadata(stepConfig);
  });
});

describe('fetch-artifacts', () => {
  test('success', async () => {
    recording = setupArtifactoryRecording({
      name: 'fetch-artifacts',
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

    const stepConfig = buildStepTestConfig(Steps.ARTIFACTS);
    const stepResults = await executeStepWithDependencies(stepConfig);
    expect(stepResults).toMatchStepMetadata(stepConfig);
  });
});
