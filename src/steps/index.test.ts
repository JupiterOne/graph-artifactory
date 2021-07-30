import {
  createMockStepExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';

import { integrationConfig } from '../../test/config';
import { setupArtifactoryRecording } from '../../test/helpers/recording';
import { IntegrationConfig } from '../types';
import { fetchAccessTokens, fetchGroups, fetchUsers } from './access';
import { fetchAccountDetails } from './account';
import { fetchBuilds } from './builds';
import { fetchPermissions } from './permissions';
import { fetchPipelineSources } from './pipelineSources';
import {
  fetchArtifacts,
  fetchRepositories,
  generateRepositoryGroups,
} from './repositories';

jest.setTimeout(10000 * 5);

describe('JFrog Arrifactory', () => {
  let recording: Recording;

  afterEach(async () => {
    await recording.stop();
  });

  test('should collect data', async () => {
    recording = setupArtifactoryRecording({
      directory: __dirname,
      name: 'invalidConfig',
      options: {
        matchRequestsBy: {
          url: {
            hostname: false,
          },
        },
        recordFailedRequests: true,
      },
    });

    const context = createMockStepExecutionContext<IntegrationConfig>({
      instanceConfig: integrationConfig,
    });

    await fetchAccountDetails(context);
    await fetchGroups(context);
    await fetchUsers(context);
    await fetchAccessTokens(context);
    await fetchRepositories(context);
    await fetchPipelineSources(context);
    await fetchArtifacts(context);
    await fetchBuilds(context);
    await fetchPermissions(context);
    await generateRepositoryGroups(context);

    expect({
      numCollectedEntities: context.jobState.collectedEntities.length,
      numCollectedRelationships: context.jobState.collectedRelationships.length,
      collectedEntities: context.jobState.collectedEntities,
      collectedRelationships: context.jobState.collectedRelationships,
      encounteredTypes: context.jobState.encounteredTypes,
    }).toMatchSnapshot();

    expect(
      context.jobState.collectedEntities.filter((e) =>
        e._class.includes('Account'),
      ),
    ).toMatchGraphObjectSchema({
      _class: ['Account'],
      schema: {
        additionalProperties: true,
        properties: {
          _type: { const: 'artifactory_account' },
          _rawData: {
            type: 'array',
            items: { type: 'object' },
          },
          webLink: {
            type: 'string',
            format: 'url',
          },
          displayName: {
            type: 'string',
          },
          username: {
            type: 'string',
          },
          email: {
            type: 'string',
          },
          policyManager: {
            type: 'boolean',
          },
          watchManager: {
            type: 'boolean',
          },
          reportsManager: {
            type: 'boolean',
          },
          profileUpdatable: {
            type: 'boolean',
          },
          internalPasswordDisable: {
            type: 'boolean',
          },
          realm: {
            type: 'string',
          },
          disableUIAccess: {
            type: 'boolean',
          },
          mfaStatus: {
            type: 'boolean',
          },
        },
        required: [],
      },
    });

    expect(
      context.jobState.collectedEntities.filter((e) =>
        e._class.includes('User'),
      ),
    ).toMatchGraphObjectSchema({
      _class: ['User'],
      schema: {
        additionalProperties: true,
        properties: {
          _type: { const: 'artifactory_user' },
          _rawData: {
            type: 'array',
            items: { type: 'object' },
          },
          webLink: {
            type: 'string',
            format: 'url',
          },
          displayName: {
            type: 'string',
          },
          username: {
            type: 'string',
          },
          email: {
            type: 'string',
          },
          policyManager: {
            type: 'boolean',
          },
          watchManager: {
            type: 'boolean',
          },
          reportsManager: {
            type: 'boolean',
          },
          profileUpdatable: {
            type: 'boolean',
          },
          internalPasswordDisable: {
            type: 'boolean',
          },
          realm: {
            type: 'string',
          },
          disableUIAccess: {
            type: 'boolean',
          },
          mfaStatus: {
            type: 'boolean',
          },
        },
        required: [],
      },
    });

    expect(
      context.jobState.collectedEntities.filter((e) =>
        e._class.includes('UserGroup'),
      ),
    ).toMatchGraphObjectSchema({
      _class: ['UserGroup'],
      schema: {
        additionalProperties: true,
        properties: {
          _type: { const: 'artifactory_group' },
          _rawData: {
            type: 'array',
            items: { type: 'object' },
          },
          webLink: {
            type: 'string',
            format: 'url',
          },
          displayName: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          autoJoin: {
            type: 'boolean',
          },
          adminPrivileges: {
            type: 'boolean',
          },
          realm: {
            type: 'string',
          },
          realmAttributes: {
            type: 'string',
          },
          userNames: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          policyManager: {
            type: 'boolean',
          },
          watchManager: {
            type: 'boolean',
          },
          reportsManager: {
            type: 'boolean',
          },
        },
        required: [],
      },
    });

    expect(
      context.jobState.collectedEntities.filter((e) =>
        e._class.includes('Repository'),
      ),
    ).toMatchGraphObjectSchema({
      _class: ['Repository'],
      schema: {
        additionalProperties: true,
        properties: {
          _type: { const: 'artifactory_repository' },
          _rawData: {
            type: 'array',
            items: { type: 'object' },
          },
          webLink: {
            type: 'string',
            format: 'url',
          },
          displayName: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          type: {
            type: 'string',
          },
        },
        required: [],
      },
    });

    expect(
      context.jobState.collectedEntities.filter(
        (e) =>
          e._class.includes('Group') &&
          e._type === 'artifactory_repository_group',
      ),
    ).toMatchGraphObjectSchema({
      _class: ['Group'],
      schema: {
        additionalProperties: true,
        properties: {
          _type: { const: 'artifactory_repository_group' },
          _rawData: {
            type: 'array',
            items: { type: 'object' },
          },
          webLink: {
            type: 'string',
            format: 'url',
          },
          type: {
            type: 'string',
          },
        },
        required: [],
      },
    });

    expect(
      context.jobState.collectedEntities.filter((e) =>
        e._class.includes('AccessKey'),
      ),
    ).toMatchGraphObjectSchema({
      _class: ['Key', 'AccessKey'],
      schema: {
        additionalProperties: true,
        properties: {
          _type: { const: 'artifactory_access_token' },
          _rawData: {
            type: 'array',
            items: { type: 'object' },
          },
          name: {
            type: 'string',
          },
        },
        required: [],
      },
    });

    expect(
      context.jobState.collectedEntities.filter((e) =>
        e._class.includes('CodeRepo'),
      ),
    ).toMatchGraphObjectSchema({
      _class: ['CodeRepo'],
      schema: {
        additionalProperties: true,
        properties: {
          _type: { const: 'artifactory_pipeline_source' },
          _rawData: {
            type: 'array',
            items: { type: 'object' },
          },
          name: {
            type: 'string',
          },
        },
        required: [],
      },
    });

    expect(
      context.jobState.collectedEntities.filter(
        (e) =>
          e._class.includes('CodeModule') &&
          e._type === 'artifactory_artifact_codemodule',
      ),
    ).toMatchGraphObjectSchema({
      _class: ['CodeModule'],
      schema: {
        additionalProperties: true,
        properties: {
          _type: { const: 'artifactory_artifact_codemodule' },
          _rawData: {
            type: 'array',
            items: { type: 'object' },
          },
          name: {
            type: 'string',
          },
        },
        required: [],
      },
    });

    expect(
      context.jobState.collectedEntities.filter((e) =>
        e._class.includes('Configuration'),
      ),
    ).toMatchGraphObjectSchema({
      _class: ['Configuration'],
      schema: {
        additionalProperties: true,
        properties: {
          _type: { const: 'artifactory_build' },
          _rawData: {
            type: 'array',
            items: { type: 'object' },
          },
          name: {
            type: 'string',
          },
        },
        required: [],
      },
    });
  });
});
