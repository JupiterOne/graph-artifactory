jest.setTimeout(10000);
import {
  IntegrationLogger,
  IntegrationProviderAPIError,
} from '@jupiterone/integration-sdk-core';
import { createMockIntegrationLogger } from '@jupiterone/integration-sdk-testing';
import { APIClient } from './client';
import { ArtifactoryArtifactResponse } from './types';
import { integrationConfig } from '../test/config';

jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());

const fetchMock = require('node-fetch');
fetchMock.config.overwriteRoutes = false;

function getIntegrationLogger(): IntegrationLogger {
  return createMockIntegrationLogger();
}

describe('iterateRepositoryArtifacts', () => {
  let client: APIClient;
  const baseUrl = `https://${integrationConfig.clientNamespace}.jfrog.io`;

  beforeAll(() => {
    client = new APIClient(getIntegrationLogger(), integrationConfig);
  });

  afterEach(() => {
    fetchMock.reset();
  });

  it('should iterate over all file nodes', async () => {
    // Mock the initial response from the API
    const initialResponse: ArtifactoryArtifactResponse = {
      repo: 'my-repo',
      path: '/',
      children: [
        { uri: '/folder1', folder: true },
        { uri: '/file1.txt', folder: false },
        { uri: '/file2.txt', folder: false },
        { uri: '/folder2', folder: true },
      ],
      uri: `${baseUrl}/artifactory/api/storage/my-repo`,
    };
    fetchMock.get(
      `${baseUrl}/artifactory/api/storage/my-repo`,
      initialResponse,
    );

    // Mock the responses for each folder
    const folder1Response: ArtifactoryArtifactResponse = {
      repo: 'my-repo',
      path: '/folder1',
      children: [{ uri: 'file3.txt', folder: false }],
      uri: `${baseUrl}/artifactory/api/storage/my-repo/folder1`,
    };
    fetchMock.get(
      `${baseUrl}/artifactory/api/storage/my-repo/folder1`,
      folder1Response,
    );

    const folder2Response: ArtifactoryArtifactResponse = {
      repo: 'my-repo',
      path: '/folder2',
      children: [{ uri: 'file4.txt', folder: false }],
      uri: `${baseUrl}/artifactory/api/storage/my-repo/folder2`,
    };
    fetchMock.get(
      `${baseUrl}/artifactory/api/storage/my-repo/folder2`,
      folder2Response,
    );

    const iteratee = jest.fn();
    await client.iterateRepositoryArtifacts('my-repo', iteratee);

    expect(iteratee).toHaveBeenCalledTimes(4);
    expect(iteratee).toHaveBeenCalledWith({
      uri: `${baseUrl}/artifactory/my-repo/file1.txt`,
      folder: false,
    });
    expect(iteratee).toHaveBeenCalledWith({
      uri: `${baseUrl}/artifactory/my-repo/file2.txt`,
      folder: false,
    });
    expect(iteratee).toHaveBeenCalledWith({
      uri: `${baseUrl}/artifactory/my-repo/folder1/file3.txt`,
      folder: false,
    });
    expect(iteratee).toHaveBeenCalledWith({
      uri: `${baseUrl}/artifactory/my-repo/folder2/file4.txt`,
      folder: false,
    });
    expect(fetchMock.done()).toBe(true);
  });

  it('should not call iteratee when there are no files in the repository', async () => {
    const artifactResponse: ArtifactoryArtifactResponse = {
      repo: 'repo',
      path: 'path',
      children: [],
      uri: '',
    };
    fetchMock.get(
      `${baseUrl}/artifactory/api/storage/my-repo`,
      artifactResponse,
    );

    const iteratee = jest.fn();
    await expect(
      client.iterateRepositoryArtifacts('my-repo', iteratee),
    ).resolves.toBeUndefined();

    expect(iteratee).not.toHaveBeenCalled();
    expect(fetchMock.done()).toBe(true);
  });

  it('retries on recoverable error', async () => {
    const response1 = {
      repo: 'my-repo',
      path: '/',
      children: [{ uri: '/folder1', folder: true }],
      uri: `${baseUrl}/artifactory/api/storage/my-repo`,
    };
    const response2 = {
      repo: 'my-repo',
      path: '/folder1',
      children: [{ uri: 'file3.txt', folder: false }],
      uri: `${baseUrl}/artifactory/api/storage/my-repo/folder1`,
    };
    fetchMock
      .get(`${baseUrl}/artifactory/api/storage/my-repo`, response1)
      .get(`${baseUrl}/artifactory/api/storage/my-repo/folder1`, 408, {
        repeat: 1,
      })
      .get(`${baseUrl}/artifactory/api/storage/my-repo/folder1`, response2, {
        repeat: 1,
      });

    const iteratee = jest.fn();
    await client.iterateRepositoryArtifacts('my-repo', iteratee);

    expect(iteratee).toHaveBeenCalledTimes(1);
    expect(iteratee).toHaveBeenCalledWith({
      uri: `${baseUrl}/artifactory/my-repo/folder1/file3.txt`,
      folder: false,
    });
    expect(fetchMock.done()).toBe(true);
  });

  it('throws on unrecoverable error', async () => {
    fetchMock.get(`${baseUrl}/artifactory/api/storage/my-repo`, 404);

    const iteratee = jest.fn();
    await expect(
      client.iterateRepositoryArtifacts('my-repo', iteratee),
    ).rejects.toThrow(IntegrationProviderAPIError);

    expect(iteratee).toHaveBeenCalledTimes(0);
    expect(fetchMock.done()).toBe(true);
  });

  it('ignores inner folders if the request is aborted', async () => {
    const response1 = {
      repo: 'my-repo',
      path: '/',
      children: [
        { uri: '/folder1', folder: true },
        { uri: '/file1.txt', folder: false },
        { uri: '/folder2', folder: true },
      ],
      uri: `${baseUrl}/artifactory/api/storage/my-repo`,
    };

    const folder2Response: ArtifactoryArtifactResponse = {
      repo: 'my-repo',
      path: '/folder2',
      children: [{ uri: 'file4.txt', folder: false }],
      uri: `${baseUrl}/artifactory/api/storage/my-repo/folder2`,
    };
    fetchMock
      .get(`${baseUrl}/artifactory/api/storage/my-repo`, response1)
      .get(`${baseUrl}/artifactory/api/storage/my-repo/folder1`, 404)
      .get(
        `${baseUrl}/artifactory/api/storage/my-repo/folder2`,
        folder2Response,
      );

    const iteratee = jest.fn();
    await client.iterateRepositoryArtifacts('my-repo', iteratee);

    expect(iteratee).toHaveBeenCalledTimes(2);
    expect(iteratee).toHaveBeenCalledWith({
      uri: `${baseUrl}/artifactory/my-repo/file1.txt`,
      folder: false,
    });
    expect(iteratee).toHaveBeenCalledWith({
      uri: `${baseUrl}/artifactory/my-repo/folder2/file4.txt`,
      folder: false,
    });
    expect(fetchMock.done()).toBe(true);
  });
});
