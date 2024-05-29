import {
  IntegrationProviderAuthenticationError,
  IntegrationValidationError,
  IntegrationLogger,
  IntegrationProviderAPIError,
} from '@jupiterone/integration-sdk-core';
import {
  ArtifactEntity,
  ArtifactoryAccessToken,
  ArtifactoryAccessTokenResponse,
  ArtifactoryArtifactResponse,
  ArtifactoryBuild,
  ArtifactoryBuildArtifactsResponse,
  ArtifactoryBuildDetailsResponse,
  ArtifactoryBuildRef,
  ArtifactoryBuildResponse,
  ArtifactoryGroup,
  ArtifactoryGroupRef,
  ArtifactoryPermission,
  ArtifactoryPermissionRef,
  ArtifactoryPipelineSource,
  ArtifactoryRepository,
  ArtifactoryUser,
  ArtifactoryUserRef,
  IntegrationConfig,
  ResourceIteratee,
} from './types';
import { BaseAPIClient } from '@jupiterone/integration-sdk-http-client';
import fetch from 'node-fetch';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY = 3_000; // 3 seconds to start
const TIMEOUT = 60_000; // 3 min timeout. We need this in case Node hangs with ETIMEDOUT
const RETRY_FACTOR = 2;
const ARTIFACTS_PAGE_LIMIT = 1000;

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient extends BaseAPIClient {
  private readonly clientAccessToken: string;
  private readonly clientAdminName: string;
  private readonly clientPipelineAccessToken?: string;

  constructor(
    logger: IntegrationLogger,
    readonly config: IntegrationConfig,
  ) {
    super({
      baseUrl: config.baseUrl,
      logger,
      logErrorBody: true,
      retryOptions: {
        maxAttempts: MAX_ATTEMPTS,
        delay: RETRY_DELAY,
        timeout: TIMEOUT,
        factor: RETRY_FACTOR,
        handleError: (err, context, logger) => {
          if (
            err instanceof IntegrationProviderAPIError &&
            ![408, 429, 500, 502, 503, 504].includes(err.status as number)
          ) {
            logger.info(
              { context, err },
              `Hit an unrecoverable error when attempting fetch. Aborting.`,
            );
            context.abort();
          } else {
            logger.info(
              {
                err,
                attemptNum: context.attemptNum,
                attemptsRemaining: context.attemptsRemaining,
              },
              `Hit a possibly recoverable error when attempting fetch. Retrying in a moment.`,
            );
          }
        },
      },
    });

    this.clientAccessToken = config.clientAccessToken;
    this.clientAdminName = config.clientAdminName;
    this.clientPipelineAccessToken = config.clientPipelineAccessToken;
  }

  protected getAuthorizationHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.clientAccessToken}`,
    };
  }

  public async verifyAuthentication(): Promise<void> {
    const endpoint = this.withBaseUrl(`artifactory/api/system/ping`);
    let response: Awaited<ReturnType<typeof this.request>> | undefined;
    try {
      response = await fetch(endpoint, {
        headers: this.getAuthorizationHeaders(),
        redirect: 'error',
      });
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint,
        status: err.statusCode,
        statusText: err.statusText,
      });
    }

    if (response.status !== 200) {
      throw new IntegrationProviderAuthenticationError({
        endpoint,
        status: response.status,
        statusText: response.statusText,
      });
    }
  }

  public async verifyPipelineAuthentication(): Promise<void> {
    const endpoint = this.withBaseUrl(
      'pipelines/api/v1/pipelinesources?limit=1',
    );
    try {
      const response = await this.request(endpoint, {
        headers: {
          Authorization: `Bearer ${this.clientPipelineAccessToken}`,
        },
      });

      if (response.status !== 200) {
        throw new IntegrationProviderAuthenticationError({
          endpoint,
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint,
        status: err.options ? err.options.statusCode : -1,
        statusText: err.options ? err.options.statusText : '',
      });
    }
  }

  /**
   * Returns the account (name = admin) which is auto-generated once cloud-based account is made.
   */
  public async getAccount(): Promise<ArtifactoryUser> {
    const response = await this.retryableRequest(
      'artifactory/api/security/users',
    );

    const users: ArtifactoryUser[] = await response.json();

    const adminUser = users.find((user) => user.name === this.clientAdminName);

    if (adminUser) {
      const resp = await this.retryableRequest(adminUser.uri);
      const accountData: ArtifactoryUser = await resp.json();

      return accountData;
    } else {
      throw new IntegrationValidationError(
        '{clientAdminName} provided in the Config is not a valid user.',
      );
    }
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    iteratee: ResourceIteratee<ArtifactoryUser>,
  ): Promise<void> {
    const response = await this.retryableRequest(
      'artifactory/api/security/users',
    );

    const userRefs: ArtifactoryUserRef[] = await response.json();

    for (const user of userRefs) {
      const resp = await this.retryableRequest(user.uri);
      await iteratee(await resp.json());
    }
  }

  /**
   * Iterates each group resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateGroups(
    iteratee: ResourceIteratee<ArtifactoryGroup>,
  ): Promise<void> {
    const response = await this.retryableRequest(
      'artifactory/api/security/groups',
    );
    const groupRefs: ArtifactoryGroupRef[] = await response.json();

    for (const group of groupRefs) {
      const resp = await this.retryableRequest(group.uri);
      await iteratee(await resp.json());
    }
  }

  /**
   * Iterates each repository in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateRepositories(
    iteratee: ResourceIteratee<ArtifactoryRepository>,
  ): Promise<void> {
    const response = await this.retryableRequest(
      'artifactory/api/repositories',
    );

    const repositories: ArtifactoryRepository[] = await response.json();

    for (const repository of repositories) {
      await iteratee(repository);
    }
  }

  /**
   * Iterates each repository in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iteratePermissions(
    iteratee: ResourceIteratee<ArtifactoryPermission>,
  ): Promise<void> {
    const response = await this.retryableRequest(
      'artifactory/api/v2/security/permissions',
    );

    const permissionRefs: ArtifactoryPermissionRef[] = await response.json();

    for (const permission of permissionRefs) {
      const resp = await this.retryableRequest(permission.uri);

      await iteratee(await resp.json());
    }
  }

  /**
   * Iterates each access token in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateAccessTokens(
    iteratee: ResourceIteratee<ArtifactoryAccessToken>,
  ): Promise<void> {
    const response = await this.retryableRequest(
      'artifactory/api/security/token',
    );

    const accessTokens: ArtifactoryAccessTokenResponse = await response.json();

    for (const accessToken of accessTokens.tokens || []) {
      await iteratee(accessToken);
    }
  }

  /**
   * Iterates each repository artifact in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateRepositoryArtifacts(
    keys: string[],
    iteratee: ResourceIteratee<ArtifactEntity>,
    initialLimit = ARTIFACTS_PAGE_LIMIT,
  ): Promise<void> {
    let offset = 0;
    let currentLimit = initialLimit;
    const minLimit = Math.max(initialLimit / 2 ** 3, 1);
    const url = 'artifactory/api/search/aql';
    const getQuery = (repoKeys: string[], offset: number) => {
      const reposQuery = JSON.stringify(
        repoKeys.map((repoKey) => ({ repo: repoKey })),
      );
      return `items.find({"$or": ${reposQuery}}).offset(${offset}).limit(${currentLimit})`;
    };
    let continuePaginating = false;
    do {
      try {
        const response = await this.retryableRequest(url, {
          method: 'POST',
          body: getQuery(keys, offset),
          bodyType: 'text',
          headers: { 'Content-Type': 'text/plain' },
        });
        const data = (await response.json()) as ArtifactoryArtifactResponse;
        for (const artifact of data.results || []) {
          const uri = this.withBaseUrl(
            `artifactory/${artifact.repo}/${artifact.path}/${artifact.name}`,
          );
          await iteratee({
            ...artifact,
            uri,
          });
        }
        continuePaginating = Boolean(data.results?.length);
        offset += currentLimit;
      } catch (err) {
        if (err.code === 'ATTEMPT_TIMEOUT') {
          // We'll stop trying to reduce the page size when we reach 125. Starting from 1000 that gives us 3 retries.
          const newLimit = Math.max(Math.floor(currentLimit / 2), minLimit);
          if (newLimit === currentLimit) {
            // We can't reduce the page size any further, throw error.
            throw err;
          }
          currentLimit = newLimit;
          continuePaginating = true;
        } else {
          throw err;
        }
      }
    } while (continuePaginating);
  }

  /**
   * Iterates each build in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateBuilds(
    iteratee: ResourceIteratee<ArtifactoryBuild>,
  ): Promise<void> {
    const response = await this.retryableRequest('artifactory/api/build');

    const jsonResponse: ArtifactoryBuildResponse = await response.json();

    // A list of artifactory/api/build/<name>
    for (const build of jsonResponse.builds || []) {
      const buildList = await this.getBuildList(build);

      // A list of artifactory/api/build/<name>/<number>
      for (const buildUri of buildList) {
        const name = build.uri.split('/')[1];
        const number = buildUri.split('/')[1];
        const artifacts = await this.getBuildArtifacts(name, number);

        if (artifacts.length === 0) {
          return;
        }

        const repository = artifacts[0]
          .split(this.withBaseUrl('artifactory'))[1]
          .split('/')[1];

        await iteratee({
          name,
          number,
          repository,
          artifacts,
          uri: this.withBaseUrl(`ui/builds${build.uri}`),
        });
      }
    }
  }

  private async getBuildList(buildRef: ArtifactoryBuildRef): Promise<string[]> {
    const response = await this.retryableRequest(
      `artifactory/api/build${buildRef.uri}`,
    );

    const jsonResponse: ArtifactoryBuildDetailsResponse = await response.json();

    return (jsonResponse.buildsNumbers || []).map((b) => b.uri);
  }

  private async getBuildArtifacts(
    name: string,
    number: string,
  ): Promise<string[]> {
    const response = await this.retryableRequest(
      'artifactory/api/search/buildArtifacts',
      {
        method: 'POST',
        body: {
          buildName: name,
          buildNumber: number,
        },
      },
    );

    const jsonResponse: ArtifactoryBuildArtifactsResponse =
      await response.json();

    if (jsonResponse.errors) {
      return [];
    }

    return jsonResponse.results.map((r) => r.downloadUri);
  }

  /**
   * Iterates each pipeline source in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iteratePipelineSources(
    iteratee: ResourceIteratee<ArtifactoryPipelineSource>,
  ): Promise<void> {
    const response = await this.retryableRequest(
      'pipelines/api/v1/pipelinesources',
      {
        headers: {
          Authorization: `Bearer ${this.clientPipelineAccessToken}`,
        },
      },
    );

    const sources: ArtifactoryPipelineSource[] = await response.json();

    for (const source of sources || []) {
      await iteratee(source);
    }
  }
}

let client: APIClient | undefined;

export function createAPIClient(
  logger: IntegrationLogger,
  config: IntegrationConfig,
): APIClient {
  if (!client) {
    client = new APIClient(logger, config);
  }
  return client;
}
