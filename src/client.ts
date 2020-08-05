import fetch, { Response } from 'node-fetch';
import { IntegrationProviderAuthenticationError } from '@jupiterone/integration-sdk-core';
import {
  IntegrationConfig,
  StatusError,
  JFrogUser,
  JFrogGroup,
  ResourceIteratee,
  JFrogGroupRef,
  JFrogUserRef,
  JFrogRepository,
  JFrogPermission,
  JFrogPermissionRef,
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

  constructor(readonly config: IntegrationConfig) {
    this.clientNamespace = config.clientNamespace;
    this.clientAccessToken = config.clientAccessToken;
    this.clientAdminName = config.clientAdminName;
  }

  private withBaseUri(path: string): string {
    return `https://${this.clientNamespace}.jfrog.io/${path}`;
  }

  private async request(
    uri: string,
    method: 'GET' | 'HEAD' = 'GET',
  ): Promise<Response> {
    return fetch(uri, {
      method,
      headers: {
        Authorization: `Bearer ${this.clientAccessToken}`,
      },
    });
  }

  public async verifyAuthentication(): Promise<void> {
    try {
      const response = await this.request(
        this.withBaseUri('artifactory/api/security/users'),
        'GET',
      );

      if (response.status !== 200) {
        throw new StatusError({
          message: 'Provider authentication failed',
          statusCode: response.status,
          statusText: response.statusText,
        });
      }
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: `https://${this.clientNamespace}.jfrog.io/artifactory/api/security/users`,
        status: err.options ? err.options.statusCode : -1,
        statusText: err.options ? err.options.statusText : '',
      });
    }
  }

  /**
   * Returns the account (name = admin) which is auto-generated once cloud-based account is made.
   */
  public async getAccount(): Promise<JFrogUser> {
    const response = await this.request(
      this.withBaseUri('artifactory/api/security/users'),
    );

    const users: JFrogUser[] = await response.json();

    const adminUser = users.find((user) => user.name === this.clientAdminName);

    if (adminUser) {
      const resp = await this.request(adminUser.uri);
      const accountData: JFrogUser = await resp.json();

      return accountData;
    } else {
      throw new Error('Unable to find admin user from users response');
    }
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    iteratee: ResourceIteratee<JFrogUser>,
  ): Promise<void> {
    const response = await this.request(
      this.withBaseUri('artifactory/api/security/users'),
    );

    const userRefs: JFrogUserRef[] = await response.json();

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
    iteratee: ResourceIteratee<JFrogGroup>,
  ): Promise<void> {
    const response = await this.request(
      this.withBaseUri('artifactory/api/security/groups'),
    );
    const groupRefs: JFrogGroupRef[] = await response.json();

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
    iteratee: ResourceIteratee<JFrogRepository>,
  ): Promise<void> {
    const response = await this.request(
      this.withBaseUri('artifactory/api/repositories'),
    );

    const repositories: JFrogRepository[] = await response.json();

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
    iteratee: ResourceIteratee<JFrogPermission>,
  ): Promise<void> {
    const response = await this.request(
      this.withBaseUri('artifactory/api/security/permissions'),
    );

    const permissionRefs: JFrogPermissionRef[] = await response.json();

    for (const permission of permissionRefs) {
      const resp = await this.request(permission.uri);
      await iteratee(await resp.json());
    }
  }
}

export function createAPIClient(config: IntegrationConfig): APIClient {
  return new APIClient(config);
}
