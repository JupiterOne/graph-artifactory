import fetch, { Response } from 'node-fetch';
import {
  IntegrationProviderAuthenticationError,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';
import {
  IntegrationConfig,
  ArtifactoryUser,
  ArtifactoryGroup,
  ResourceIteratee,
  ArtifactoryGroupRef,
  ArtifactoryUserRef,
  ArtifactoryRepository,
  ArtifactoryPermission,
  ArtifactoryPermissionRef,
  ArtifactoryAccessToken,
  ArtifactoryBuild,
  ArtifactoryBuildRef,
  ArtifactoryBuildResponse,
  ArtifactoryArtifactRef,
  ArtifactoryArtifactResponse,
  ArtifactoryBuildArtifactsResponse,
  ArtifactoryPipelineSource,
  ArtifactoryBuildDetailsResponse,
  ArtifactoryAccessTokenResponse,
} from './types';

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  private readonly clientNamespace: string;
  private readonly clientAccessToken: string;
  private readonly clientAdminName: string;
  private readonly clientPipelineAccessToken?: string;

  constructor(readonly config: IntegrationConfig) {
    this.clientNamespace = config.clientNamespace;
    this.clientAccessToken = config.clientAccessToken;
    this.clientAdminName = config.clientAdminName;
    this.clientPipelineAccessToken = config.clientPipelineAccessToken;
  }

  private withBaseUri(path: string): string {
    return `https://${this.clientNamespace}.jfrog.io/${path}`;
  }

  private async request(
    uri: string,
    method: 'GET' | 'HEAD' | 'POST' = 'GET',
    body?,
    headers = {},
  ): Promise<Response> {
    return fetch(uri, {
      method,
      headers: {
        Authorization: `Bearer ${this.clientAccessToken}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body,
    });
  }

  public async verifyAuthentication(): Promise<void> {
    const endpoint = this.withBaseUri(
      `artifactory/api/security/users/${this.clientAdminName}`,
    );
    let invalidAdminName = false;
    try {
      const response = await this.request(endpoint, 'GET');

      if (response.status == 404) {
        // If we got a 404 it is because it couldn't find the admin name
        invalidAdminName = true;
      } else if (response.status !== 200) {
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

    if (invalidAdminName) {
      throw new IntegrationValidationError(
        "Recieved 404: Verify the 'Client Administrator Name' provided in the Config is a valid user.",
      );
    }
  }

  public async verifyPipelineAuthentication(): Promise<void> {
    const endpoint = this.withBaseUri(
      'pipelines/api/v1/pipelinesources?limit=1',
    );
    try {
      const response = await this.request(endpoint, 'GET', null, {
        Authorization: `Bearer ${this.clientPipelineAccessToken}`,
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
    const response = await this.request(
      this.withBaseUri('artifactory/api/security/users'),
    );

    const users: ArtifactoryUser[] = await response.json();

    const adminUser = users.find((user) => user.name === this.clientAdminName);

    if (adminUser) {
      const resp = await this.request(adminUser.uri);
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
    const response = await this.request(
      this.withBaseUri('artifactory/api/security/users'),
    );

    const userRefs: ArtifactoryUserRef[] = await response.json();

    for (const user of userRefs) {
      const resp = await this.request(user.uri);
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
    const response = await this.request(
      this.withBaseUri('artifactory/api/security/groups'),
    );
    const groupRefs: ArtifactoryGroupRef[] = await response.json();

    for (const group of groupRefs) {
      const resp = await this.request(group.uri);
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
    const response = await this.request(
      this.withBaseUri('artifactory/api/repositories'),
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
    const response = await this.request(
      this.withBaseUri('artifactory/api/v2/security/permissions'),
    );

    const permissionRefs: ArtifactoryPermissionRef[] = await response.json();

    for (const permission of permissionRefs) {
      const resp = await this.request(permission.uri);

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
    const response = await this.request(
      this.withBaseUri('artifactory/api/security/token'),
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
    key: string,
    iteratee: ResourceIteratee<ArtifactoryArtifactRef>,
  ): Promise<void> {
    const response = await this.request(
      this.withBaseUri(`artifactory/api/storage/${key}`),
    );

    await this.recurseArtifacts(await response.json(), iteratee);
  }

  private async recurseArtifacts(
    response: ArtifactoryArtifactResponse,
    iteratee: ResourceIteratee<ArtifactoryArtifactRef>,
  ): Promise<void> {
    for (const artifact of response.children || []) {
      if (artifact.folder) {
        const nextUri = `${response.uri}${artifact.uri}`;
        const nextResponse = await this.request(nextUri);

        await this.recurseArtifacts(await nextResponse.json(), iteratee);
      } else {
        await iteratee({
          ...artifact,
          uri: this.withBaseUri(
            `artifactory/${response.repo}${response.path}${artifact.uri}`,
          ),
        });
      }
    }
  }

  /**
   * Iterates each build in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateBuilds(
    iteratee: ResourceIteratee<ArtifactoryBuild>,
  ): Promise<void> {
    const response = await this.request(
      this.withBaseUri('artifactory/api/build'),
    );

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
          .split(this.withBaseUri('artifactory'))[1]
          .split('/')[1];

        await iteratee({
          name,
          number,
          repository,
          artifacts,
          uri: this.withBaseUri(`ui/builds${build.uri}`),
        });
      }
    }
  }

  private async getBuildList(buildRef: ArtifactoryBuildRef): Promise<string[]> {
    const response = await this.request(
      this.withBaseUri(`artifactory/api/build${buildRef.uri}`),
    );

    const jsonResponse: ArtifactoryBuildDetailsResponse = await response.json();

    return (jsonResponse.buildsNumbers || []).map((b) => b.uri);
  }

  private async getBuildArtifacts(
    name: string,
    number: string,
  ): Promise<string[]> {
    const response = await this.request(
      this.withBaseUri('artifactory/api/search/buildArtifacts'),
      'POST',
      JSON.stringify({
        buildName: name,
        buildNumber: number,
      }),
    );

    const jsonResponse: ArtifactoryBuildArtifactsResponse = await response.json();

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
    const response = await this.request(
      this.withBaseUri('pipelines/api/v1/pipelinesources'),
      'GET',
      null,
      {
        Authorization: `Bearer ${this.clientPipelineAccessToken}`,
      },
    );

    const sources: ArtifactoryPipelineSource[] = await response.json();

    for (const source of sources || []) {
      await iteratee(source);
    }
  }
}

export function createAPIClient(config: IntegrationConfig): APIClient {
  return new APIClient(config);
}
