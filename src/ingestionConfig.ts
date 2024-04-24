import { IntegrationIngestionConfigFieldMap } from '@jupiterone/integration-sdk-core';
import { IngestionSources } from './constants';

export const ingestionConfig: IntegrationIngestionConfigFieldMap = {
  [IngestionSources.USERS]: {
    title: 'Users',
    description: 'Ingests platform users.',
  },
  [IngestionSources.ACCESS_TOKENS]: {
    title: 'Access Tokens',
    description: 'Keys for accessing APIs.',
  },
  [IngestionSources.GROUPS]: {
    title: 'Groups',
    description: 'User groups with common access.',
  },
  [IngestionSources.REPOSITORIES]: {
    title: 'Repositories',
    description: 'Ingest all existing repositories.',
  },
  [IngestionSources.REPOSITORY_GROUPS]: {
    title: 'Repository Groups',
    description: 'Sets of related repositories.',
  },
  [IngestionSources.ARTIFACTS]: {
    title: 'Artifacts',
    description: 'Files and binaries in repositories.',
  },
  [IngestionSources.PERMISSIONS]: {
    title: 'Permissions',
    description: 'Access controls for resources.',
  },
  [IngestionSources.BUILDS]: {
    title: 'Builds',
    description: 'Compiled software versions.',
  },
  [IngestionSources.PIPELINE_SOURCES]: {
    title: 'Pipeline Sources',
    description: 'Sources for pipeline stages.',
  },
};
