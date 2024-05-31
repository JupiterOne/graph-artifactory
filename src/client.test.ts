jest.setTimeout(10000);
import {
  IntegrationLogger,
  IntegrationProviderAPIError,
} from '@jupiterone/integration-sdk-core';
import { createMockIntegrationLogger } from '@jupiterone/integration-sdk-testing';
import { APIClient } from './client';
import { ArtifactoryArtifactRef } from './types';
import { integrationConfig } from '../test/config';

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
    jest.restoreAllMocks();
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
    const responses = [
      { results: [mockArtifact('artifact-1'), mockArtifact('artifact-2')] },
      { results: [mockArtifact('artifact-3'), mockArtifact('artifact-4')] },
      { results: [] }, // Indirectly tests that it should stop pagination when an empty page is encountered
    ];
    const mockRetryableRequest = jest.spyOn(client as any, 'retryableRequest');
    let i = 0;
    mockRetryableRequest.mockImplementation(() => {
      const response = responses[i];
      i++;
      return {
        json: () => Promise.resolve(response),
      };
    });

    const iteratee = jest.fn();
    await client.iterateRepositoryArtifacts(
      ['test-repo', 'test-repo-2'],
      iteratee,
    );

    expect(mockRetryableRequest).toHaveBeenCalledTimes(3);
    expect(mockRetryableRequest.mock.calls[0][0]).toEqual(
      'artifactory/api/search/aql',
    );
    expect(mockRetryableRequest.mock.calls[0][1]).toMatchObject({
      body: 'items.find({"$or": [{"repo":"test-repo"},{"repo":"test-repo-2"}]}).offset(0).limit(1000)',
      method: 'POST',
    });
    expect(iteratee).toHaveBeenCalledTimes(4);
    for (let i = 1; i <= 4; i++) {
      expect(iteratee.mock.calls[i - 1][0]).toEqual(
        expect.objectContaining({
          uri: `${baseUrl}/artifactory/test-repo/path/to/artifact/artifact-${i}`,
        }),
      );
    }
  });

  it('should not call iteratee when there are no files in the repository', async () => {
    const mockRetryableRequest = jest.spyOn(client as any, 'retryableRequest');
    mockRetryableRequest.mockImplementationOnce(() => {
      return {
        json: () => Promise.resolve({ results: [] }),
      };
    });

    const iteratee = jest.fn();
    await expect(
      client.iterateRepositoryArtifacts(['test-repo'], iteratee),
    ).resolves.toBeUndefined();

    expect(iteratee).not.toHaveBeenCalled();
  });

  it('throws any other error', async () => {
    const notFoundError = new IntegrationProviderAPIError({
      endpoint: '',
      status: 404,
      statusText: 'Not Found',
    });
    const mockRetryableRequest = jest.spyOn(client as any, 'retryableRequest');
    mockRetryableRequest.mockImplementationOnce(() => {
      throw notFoundError;
    });

    const iteratee = jest.fn();
    await expect(
      client.iterateRepositoryArtifacts(['my-repo'], iteratee),
    ).rejects.toThrow(IntegrationProviderAPIError);

    expect(iteratee).toHaveBeenCalledTimes(0);
  });

  it('should retry with half repo keys when timeout error encountered', async () => {
    const timeoutError = new Error();
    (timeoutError as any).code = 'ETIMEDOUT';
    const mockRetryableRequest = jest.spyOn(client as any, 'retryableRequest');
    mockRetryableRequest
      .mockImplementationOnce(() => {
        return Promise.reject(timeoutError);
      })
      .mockImplementationOnce(() => {
        return {
          json: () =>
            Promise.resolve({
              results: [
                mockArtifact('artifact-1'),
                mockArtifact('artifact-2'),
                mockArtifact('artifact-3'),
                mockArtifact('artifact-4'),
              ],
            }),
        };
      })
      .mockImplementationOnce(() => {
        return {
          json: () => Promise.resolve({ results: [] }),
        };
      })
      .mockImplementationOnce(() => {
        return {
          json: () =>
            Promise.resolve({
              results: [
                mockArtifact('artifact-5'),
                mockArtifact('artifact-6'),
                mockArtifact('artifact-7'),
                mockArtifact('artifact-8'),
              ],
            }),
        };
      })
      .mockImplementationOnce(() => {
        return {
          json: () => Promise.resolve({ results: [] }),
        };
      });

    const iteratee = jest.fn();
    await client.iterateRepositoryArtifacts(
      ['test-repo', 'test-repo-2', 'test-repo-3', 'test-repo-4'],
      iteratee,
      4, // initialChunkSize for tests
    );

    expect(mockRetryableRequest).toHaveBeenCalledTimes(5);
    expect(mockRetryableRequest).toHaveBeenNthCalledWith(
      1,
      'artifactory/api/search/aql',
      expect.objectContaining({
        body: 'items.find({"$or": [{"repo":"test-repo"},{"repo":"test-repo-2"},{"repo":"test-repo-3"},{"repo":"test-repo-4"}]}).offset(0).limit(1000)',
      }),
    );
    expect(mockRetryableRequest).toHaveBeenNthCalledWith(
      2,
      'artifactory/api/search/aql',
      expect.objectContaining({
        body: 'items.find({"$or": [{"repo":"test-repo"},{"repo":"test-repo-2"}]}).offset(0).limit(1000)',
      }),
    );
    expect(mockRetryableRequest).toHaveBeenNthCalledWith(
      3,
      'artifactory/api/search/aql',
      expect.objectContaining({
        body: 'items.find({"$or": [{"repo":"test-repo"},{"repo":"test-repo-2"}]}).offset(1000).limit(1000)',
      }),
    );
    expect(mockRetryableRequest).toHaveBeenNthCalledWith(
      4,
      'artifactory/api/search/aql',
      expect.objectContaining({
        body: 'items.find({"$or": [{"repo":"test-repo-3"},{"repo":"test-repo-4"}]}).offset(0).limit(1000)',
      }),
    );
    expect(mockRetryableRequest).toHaveBeenNthCalledWith(
      5,
      'artifactory/api/search/aql',
      expect.objectContaining({
        body: 'items.find({"$or": [{"repo":"test-repo-3"},{"repo":"test-repo-4"}]}).offset(1000).limit(1000)',
      }),
    );

    expect(iteratee).toHaveBeenCalledTimes(8);
    for (let i = 1; i <= 8; i++) {
      expect(iteratee.mock.calls[i - 1][0]).toEqual(
        expect.objectContaining({
          uri: `${baseUrl}/artifactory/test-repo/path/to/artifact/artifact-${i}`,
        }),
      );
    }
  });
});
