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
   * The provider API client access token used to authenticate requests.
   */
  enablePipelineIngestion: boolean;

  /**
   * The JFrog Pipeline API client access token used to authenticate requests.
   */
  clientPipelineAccessToken?: string;

  /**
   * The provider API client admin name used for root account in the graph.
   */
  clientAdminName: string;
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
  repo?: {
    repositories: string[];
    actions: {
      users?: {
        [name: string]: string[];
      };
      groups?: {
        [name: string]: string[];
      };
    };
    'include-patterns': string[];
    'exclude-patterns': string[];
  };
  build?: {
    repositories: string[];
    actions: {
      users?: {
        [name: string]: string[];
      };
      groups?: {
        [name: string]: string[];
      };
    };
    'include-patterns': string[];
    'exclude-patterns': string[];
  };
};

export type ArtifactoryPermissionRef = {
  uri: string;
};

export type ArtifactoryAccessToken = {
  token_id: string;
  issuer: string;
  subject: string;
  expiry: number;
  refreshable: boolean;
  issued_at: number;
};

export type ArtifactoryAccessTokenResponse = {
  tokens: ArtifactoryAccessToken[];
};

export type ArtifactoryBuildRef = {
  uri: string;
  lastStarted: string;
};

export type ArtifactoryBuild = {
  name: string;
  number: string;
  repository: string;
  artifacts: string[];
  uri: string;
};

export type ArtifactoryBuildResponse = {
  builds: ArtifactoryBuildRef[];
  uri: string;
};

export type ArtifactoryArtifactRef = {
  uri: string;
  folder: boolean;
};

export type ArtifactoryArtifactResponse = {
  repo: string;
  path: string;
  children: ArtifactoryArtifactRef[];
  uri: string;
};

export type ArtifactoryBuildArtifactsResponse = {
  results: {
    downloadUri: string;
  }[];
  errors?: any;
};

export type ArtifactoryBuildDetailsResponse = {
  buildsNumbers: [
    {
      uri: string;
      started: string;
    },
  ];
};

export type ArtifactoryPipelineSource = {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
};

export type ArtifactoryArtifactNodeTypes = {
  folderNodes: ArtifactoryArtifactRef[];
  fileNodes: ArtifactoryArtifactRef[];
};
