import { Opaque } from 'type-fest';
import { IntegrationInstanceConfig } from '@jupiterone/integration-sdk-core';

/**
 * Properties provided by the `IntegrationInstance.config`. This reflects the
 * same properties defined by `instanceConfigFields`.
 */
export interface IntegrationConfig extends IntegrationInstanceConfig {
  /**
   * The provider API client namespace used to authenticate requests.
   */
  clientNamespace: string;

  /**
   * The provider API client access token used to authenticate requests.
   */
  clientAccessToken: string;

  /**
   * The provider API client admin name used for root account in the graph.
   */
  clientAdminName: string;
}

export class StatusError extends Error {
  constructor(
    readonly options: {
      statusCode: number;
      statusText: string;
      message?: string;
    },
  ) {
    super(options.message);
    this.name = 'StatusError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

export type ArtifactoryGroupName = Opaque<string, 'ArtifactoryGroupName'>;
export type ArtifactoryRealm = Opaque<string, 'ArtifactoryRealm'>;
export type ArtifactoryUsername = Opaque<string, 'ArtifactoryUsername'>;
export type ArtifactoryEmail = Opaque<string, 'ArtifactoryEmail'>;
export type ArtifactoryRepositoryName = Opaque<
  string,
  'ArtifactoryRepositoryName'
>;

export type ArtifactoryUser = {
  name: ArtifactoryUsername;
  email: ArtifactoryEmail;
  admin: boolean;
  profileUpdatable: boolean;
  disableUIAccess: boolean;
  internalPasswordDisabled: boolean;
  lastLoggedIn: Date;
  realm: ArtifactoryRealm;
  groups: ArtifactoryGroupName[];
  watchManager: boolean;
  reportsManager: boolean;
  policyManager: boolean;
  mfaStatus: string;
  uri: string;
};

export type ArtifactoryUserRef = {
  uri: string;
};

export type ArtifactoryGroup = {
  name: ArtifactoryGroupName;
  description: string;
  autoJoin: boolean;
  adminPrivileges: boolean;
  realm: ArtifactoryRealm;
  realmAttributes: string;
  policyManager: boolean;
  watchManager: boolean;
  reportsManager: boolean;
  uri: string;
};

export type ArtifactoryGroupRef = {
  uri: string;
};

export type ArtifactoryRepository = {
  key: ArtifactoryRepositoryName;
  description: string;
  type: string;
  url: string;
  packageType: string;
};

export type ArtifactoryPermission = {
  name: string;
  repositories: string[];
  principals: {
    groups?: {
      [name: string]: string[];
    };
    users?: {
      [name: string]: string[];
    };
  };
  uri: string;
};

export type ArtifactoryPermissionRef = {
  uri: string;
};
