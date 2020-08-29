import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { ACCOUNT_ENTITY_DATA_KEY, entities, relationships } from '../constants';
import { ArtifactoryRepositoryName, IntegrationConfig } from '../types';

function getRepositoryKey(name: ArtifactoryRepositoryName): string {
  return `artifactory_repository:${name}`;
}

export async function fetchRepositories({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await apiClient.iterateRepositories(async (repository) => {
    const repositoryEntity = createIntegrationEntity({
      entityData: {
        source: repository,
        assign: {
          _key: getRepositoryKey(repository.key),
          _type: entities.REPOSITORY._type,
          _class: entities.REPOSITORY._class,
          webLink: repository.url,
          displayName: repository.key,
          name: repository.key,
          description: repository.description,
          type: repository.type,
          packageType: repository.packageType,
        },
      },
    });

    const accountEntity: Entity = await jobState.getData(
      ACCOUNT_ENTITY_DATA_KEY,
    );

    await Promise.all([
      jobState.addEntity(repositoryEntity),
      jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
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
    entities: [entities.REPOSITORY],
    relationships: [relationships.ACCOUNT_HAS_REPOSITORY],
    dependsOn: ['fetch-account'],
    executionHandler: fetchRepositories,
  },
];
