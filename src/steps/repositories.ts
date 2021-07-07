import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import {
  ACCOUNT_ENTITY_DATA_KEY,
  entities,
  relationships,
  Steps,
} from '../constants';
import { IntegrationConfig } from '../types';

export function getRepositoryKey(name: string): string {
  return `artifactory_repository:${name}`;
}

export function getRepositoryGroupKey(name: string): string {
  return `artifactory_repository_group:${name}`;
}
export function getArtifactKey(uri: string): string {
  return `artifactory_artifact:${uri}`;
}

export async function generateRepositoryGroups({
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>): Promise<void> {
  const accountEntity: Entity = await jobState.getData(ACCOUNT_ENTITY_DATA_KEY);

  const groups = [
    {
      name: 'ANY',
      type: 'ANY',
    },
    {
      name: 'ANY LOCAL',
      type: 'LOCAL',
    },
    {
      name: 'ANY REMOTE',
      type: 'REMOTE',
    },
  ];

  for (const group of groups) {
    const repositoryGoupEntity = createIntegrationEntity({
      entityData: {
        source: group,
        assign: {
          _key: getRepositoryGroupKey(group.name),
          _type: entities.REPOSITORY_GROUP._type,
          _class: entities.REPOSITORY_GROUP._class,
          type: group.type,
        },
      },
    });

    await Promise.all([
      jobState.addEntity(repositoryGoupEntity),
      jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: accountEntity,
          to: repositoryGoupEntity,
        }),
      ),
    ]);
  }
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
          const artifactEntity = createIntegrationEntity({
            entityData: {
              source: artifact,
              assign: {
                _key: getArtifactKey(artifact.uri),
                _type: entities.ARTIFACT_CODEMODULE._type,
                _class: entities.ARTIFACT_CODEMODULE._class,
                name: artifact.uri,
                webLink: artifact.uri,
                packageType,
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
    id: Steps.REPOSITORIES,
    name: 'Fetch Repositories',
    entities: [entities.REPOSITORY],
    relationships: [relationships.ACCOUNT_HAS_REPOSITORY],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: fetchRepositories,
  },
  {
    id: Steps.GENERATE_REPOSITORY_GROUPS,
    name: 'Generate Repository Groups',
    entities: [entities.REPOSITORY_GROUP],
    relationships: [relationships.ACCOUNT_HAS_REPOSITORY_GROUP],
    dependsOn: [Steps.ACCOUNT],
    executionHandler: generateRepositoryGroups,
  },
  {
    id: Steps.ARTIFACTS,
    name: 'Fetch Artifacts',
    entities: [entities.ARTIFACT_CODEMODULE],
    relationships: [relationships.REPOSITORY_HAS_ARTIFACT_CODEMODULE],
    dependsOn: [Steps.REPOSITORIES],
    executionHandler: fetchArtifacts,
  },
];
