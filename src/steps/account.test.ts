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

describe('fetch-account', () => {
  test('success', async () => {
    recording = setupArtifactoryRecording({
      name: 'fetch-account',
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

    const stepConfig = buildStepTestConfig(Steps.ACCOUNT);
    const stepResults = await executeStepWithDependencies(stepConfig);
    expect(stepResults).toMatchStepMetadata(stepConfig);
  });
});
