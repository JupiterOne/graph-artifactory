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

export type JFrogGroupName = Opaque<string, 'JFrogGroupName'>;
export type JFrogRealm = Opaque<string, 'JFrogRealm'>;
export type JFrogUsername = Opaque<string, 'JFrogUsername'>;
export type JFrogEmail = Opaque<string, 'JFrogEmail'>;
export type JFrogRepositoryName = Opaque<string, 'JFrogRepositoryName'>;

export type JFrogUser = {
  name: JFrogUsername;
  email: JFrogEmail;
  admin: boolean;
  profileUpdatable: boolean;
  disableUIAccess: boolean;
  internalPasswordDisabled: boolean;
  lastLoggedIn: Date;
  realm: JFrogRealm;
  groups: JFrogGroupName[];
  watchManager: boolean;
  reportsManager: boolean;
  policyManager: boolean;
  mfaStatus: string;
  uri: string;
};

export type JFrogUserRef = {
  uri: string;
};

export type JFrogGroup = {
  name: JFrogGroupName;
  description: string;
  autoJoin: boolean;
  adminPrivileges: boolean;
  realm: JFrogRealm;
  realmAttributes: string;
  policyManager: boolean;
  watchManager: boolean;
  reportsManager: boolean;
  uri: string;
};

export type JFrogGroupRef = {
  uri: string;
};

export type JFrogRepository = {
  key: JFrogRepositoryName;
  description: string;
  type: string;
  url: string;
  packageType: string;
};

export type JFrogPermission = {
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

export type JFrogPermissionRef = {
  uri: string;
};
