import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  createDirectRelationship,
  generateRelationshipType,
  Entity,
} from '@jupiterone/integration-sdk-core';
import { createAPIClient } from '../client';
import { IntegrationConfig, JFrogRepositoryName } from '../types';
import { ACCOUNT_ENTITY_TYPE, ACCOUNT_ENTITY_KEY } from './account';

const REPOSITORY_ENTITY_TYPE = 'artifactory_repository';

function repositoryEntityId(name: JFrogRepositoryName): string {
  return `artifactory-repository-${name}`;
}

export async function fetchRepositories({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await apiClient.iterateRepositories(async (repository) => {
    const repositoryEntity = createIntegrationEntity({
      entityData: {
        source: {
          ...repository,
          id: repositoryEntityId(repository.key),
        },
        assign: {
          _type: REPOSITORY_ENTITY_TYPE,
          _class: 'Repository',
          webLink: repository.url,
          displayName: repository.key,
          name: repository.key,
          description: repository.description,
          type: repository.type,
          packageType: repository.packageType,
        },
      },
    });

    const accountEntity: Entity = await jobState.getData(ACCOUNT_ENTITY_KEY);

    await Promise.all([
      jobState.addEntity(repositoryEntity),
      jobState.addRelationship(
        createDirectRelationship({
          _class: 'HAS',
          from: accountEntity,
          to: repositoryEntity,
        }),
      ),
    ]);
  });
}

export const repositoriesSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-repositories',
    name: 'Fetch Repositories',
    types: [
      REPOSITORY_ENTITY_TYPE,
      generateRelationshipType(
        'HAS',
        ACCOUNT_ENTITY_TYPE,
        REPOSITORY_ENTITY_TYPE,
      ),
    ],
    dependsOn: ['fetch-account'],
    executionHandler: fetchRepositories,
  },
];
