import {
  createMockStepExecutionContext,
  Recording,
  setupRecording,
} from '@jupiterone/integration-sdk-testing';

import { IntegrationConfig } from '../types';
import { fetchUsers, fetchGroups } from './access';
import { fetchAccountDetails } from './account';

const integrationConfig: IntegrationConfig = {
  clientNamespace: process.env.CLIENT_NAMESPACE || 'codeworkr',
  clientAccessToken: process.env.CLIENT_ACCESS_TOKEN || 'codeworkr',
  clientAdminName: process.env.CLIENT_ADMIN_NAME || 'viragsf@gmail.com',
};

jest.setTimeout(10000 * 2);

describe('JFrog', () => {
  let recording: Recording;

  beforeEach(() => {
    recording = setupRecording({
      directory: __dirname,
      name: 'jfrog_recordings',
    });
  });

  afterEach(async () => {
    await recording.stop();
  });

  test('should collect data', async () => {
    const context = createMockStepExecutionContext<IntegrationConfig>({
      instanceConfig: integrationConfig,
    });

    await fetchAccountDetails(context);
    await fetchGroups(context);
    await fetchUsers(context);

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
  });
});
