jest.setTimeout(10000);
import {
  IntegrationLogger,
  IntegrationProviderAPIError,
} from '@jupiterone/integration-sdk-core';
import { createMockIntegrationLogger } from '@jupiterone/integration-sdk-testing';
import { APIClient } from './client';
import { ArtifactoryArtifactRef, ArtifactoryArtifactResponse } from './types';
import { integrationConfig } from '../test/config';
import { Response } from 'node-fetch';

jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());

const fetchMock = require('node-fetch');
fetchMock.config.overwriteRoutes = false;

function getIntegrationLogger(): IntegrationLogger {
  return createMockIntegrationLogger();
}

describe('iterateRepositoryArtifacts', () => {
  let client: APIClient;
  const baseUrl = integrationConfig.baseUrl;

  beforeAll(() => {
    client = new APIClient(getIntegrationLogger(), integrationConfig);
  });

  afterEach(() => {
    fetchMock.reset();
  });

  const mockArtifact = (name: string): ArtifactoryArtifactRef => ({
    repo: 'test-repo',
    path: `path/to/artifact`,
    name,
    type: 'file',
    size: 124,
    created: '2023-03-24T15:25:56.911Z',
    created_by: 'test',
    modified: '2023-03-24T15:26:02.006Z',
    modified_by: 'test',
    updated: '2023-03-24T15:26:02.067Z',
  });

  it('should call iteratee for each artifact returned by page', async () => {
    const firstResponse: ArtifactoryArtifactResponse = {
      results: [mockArtifact('artifact-1'), mockArtifact('artifact-2')],
    };
    fetchMock.post(`${baseUrl}/artifactory/api/search/aql`, firstResponse, {
      repeat: 1,
    });

    const secondResponse: ArtifactoryArtifactResponse = {
      results: [mockArtifact('artifact-3'), mockArtifact('artifact-4')],
    };

    fetchMock.post(`${baseUrl}/artifactory/api/search/aql`, secondResponse, {
      repeat: 1,
    });

    // Indirectly tests that it should stop pagination when an empty page is encountered
    fetchMock.post(
      `${baseUrl}/artifactory/api/search/aql`,
      { results: [] },
      {
        repeat: 1,
      },
    );

    const iteratee = jest.fn();
    await client.iterateRepositoryArtifacts(['test-repo'], iteratee);

    expect(iteratee).toHaveBeenCalledTimes(4);
    expect(iteratee.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        uri: `${baseUrl}/artifactory/test-repo/path/to/artifact/artifact-1`,
      }),
    );
    expect(iteratee.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        uri: `${baseUrl}/artifactory/test-repo/path/to/artifact/artifact-2`,
      }),
    );
    expect(iteratee.mock.calls[2][0]).toEqual(
      expect.objectContaining({
        uri: `${baseUrl}/artifactory/test-repo/path/to/artifact/artifact-3`,
      }),
    );
    expect(iteratee.mock.calls[3][0]).toEqual(
      expect.objectContaining({
        uri: `${baseUrl}/artifactory/test-repo/path/to/artifact/artifact-4`,
      }),
    );
    expect(fetchMock.done()).toBe(true);
  });

  it('should not call iteratee when there are no files in the repository', async () => {
    fetchMock.post(`${baseUrl}/artifactory/api/search/aql`, { results: [] });

    const iteratee = jest.fn();
    await expect(
      client.iterateRepositoryArtifacts(['test-repo'], iteratee),
    ).resolves.toBeUndefined();

    expect(iteratee).not.toHaveBeenCalled();
    expect(fetchMock.done()).toBe(true);
  });

  it('retries on recoverable error', async () => {
    const response: ArtifactoryArtifactResponse = {
      results: [mockArtifact('artifact-1')],
    };

    fetchMock
      .post(
        `${baseUrl}/artifactory/api/search/aql`,
        new Response('', { status: 408 }),
        { repeat: 1 },
      )
      .post(`${baseUrl}/artifactory/api/search/aql`, response, { repeat: 1 })
      .post(
        `${baseUrl}/artifactory/api/search/aql`,
        { results: [] },
        { repeat: 1 },
      );

    const iteratee = jest.fn();
    await client.iterateRepositoryArtifacts(['test-repo'], iteratee);

    expect(iteratee).toHaveBeenCalledTimes(1);
    expect(iteratee.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        uri: `${baseUrl}/artifactory/test-repo/path/to/artifact/artifact-1`,
      }),
    );
    expect(fetchMock.done()).toBe(true);
  });

  it('throws on unrecoverable error', async () => {
    fetchMock.post(
      `${baseUrl}/artifactory/api/search/aql`,
      new Response('', { status: 404 }),
    );

    const iteratee = jest.fn();
    await expect(
      client.iterateRepositoryArtifacts(['my-repo'], iteratee),
    ).rejects.toThrow(IntegrationProviderAPIError);

    expect(iteratee).toHaveBeenCalledTimes(0);
    expect(fetchMock.done()).toBe(true);
  });
});
