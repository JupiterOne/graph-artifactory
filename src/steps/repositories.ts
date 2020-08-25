import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  StepEntityMetadata,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { ACCOUNT_ENTITY_DATA_KEY, entities, relationships } from '../constants';
import { IntegrationConfig } from '../types';

export function getRepositoryKey(name: string): string {
  return `artifactory_repository:${name}`;
}

export function getArtifactKey(uri: string): string {
  return `artifactory_artifact:${uri}`;
}

function mapPackageTypeToStepEntityMetadata(type: string): StepEntityMetadata {
  if (type.match(/docker|vagrant/i)) {
    return entities.ARTIFACT_IMAGE;
  }

  return entities.ARTIFACT_CODEMODULE;
}

export async function fetchRepositories({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity: Entity = await jobState.getData(ACCOUNT_ENTITY_DATA_KEY);

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

export async function fetchArtifacts({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await jobState.iterateEntities(
    { _type: entities.REPOSITORY._type },
    async (repositoryEntity) => {
      const [, repositoryEntityKey] = repositoryEntity._key.split(':');
      const packageType = repositoryEntity.packageType?.toString() || '';

      await apiClient.iterateRepositoryArtifacts(
        repositoryEntityKey,
        async (artifact) => {
          const { _type, _class } = mapPackageTypeToStepEntityMetadata(
            packageType,
          );

          const artifactEntity = createIntegrationEntity({
            entityData: {
              source: artifact,
              assign: {
                _key: getArtifactKey(artifact.uri),
                _type,
                _class,
                name: artifact.uri,
                webLink: artifact.uri,
              },
            },
          });

          await Promise.all([
            jobState.addEntity(artifactEntity),
            jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.HAS,
                from: repositoryEntity,
                to: artifactEntity,
              }),
            ),
          ]);
        },
      );
    },
  );
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
  {
    id: 'fetch-artifacts',
    name: 'Fetch Artifacts',
    entities: [entities.ARTIFACT_CODEMODULE, entities.ARTIFACT_IMAGE],
    relationships: [
      relationships.REPOSITORY_HAS_ARTIFACT_CODEMODULE,
      relationships.REPOSITORY_HAS_ARTIFACT_IMAGE,
    ],
    dependsOn: ['fetch-repositories'],
    executionHandler: fetchArtifacts,
  },
];
