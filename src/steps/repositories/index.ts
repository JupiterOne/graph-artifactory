import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../../client';
import {
  ACCOUNT_ENTITY_DATA_KEY,
  entities,
  relationships,
  Steps,
} from '../../constants';
import { IntegrationConfig } from '../../types';
import { compareEntities } from '../../utils';
import { createArtifactEntity, getArtifactKey } from './converters';

export function getRepositoryKey(name: string): string {
  return `artifactory_repository:${name}`;
}

export function getRepositoryGroupKey(name: string): string {
  return `artifactory_repository_group:${name}`;
}

export async function generateRepositoryGroups({
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>): Promise<void> {
  const accountEntity = (await jobState.getData(
    ACCOUNT_ENTITY_DATA_KEY,
  )) as Entity;

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
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

  const accountEntity = (await jobState.getData(
    ACCOUNT_ENTITY_DATA_KEY,
  )) as Entity;

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
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

  await jobState.iterateEntities(
    { _type: entities.REPOSITORY._type },
    async (repositoryEntity) => {
      const [, repositoryEntityKey] = repositoryEntity._key.split(':');
      const packageType = repositoryEntity.packageType?.toString() || '';
      const repoType = repositoryEntity.type;
      const repositoryKeys =
        repoType === 'REMOTE'
          ? [repositoryEntityKey, `${repositoryEntityKey}-cache`]
          : [repositoryEntityKey];

      for (const repoKey of repositoryKeys) {
        await apiClient.iterateRepositoryArtifacts(
          repoKey,
          async (artifact) => {
            const artifactKey = getArtifactKey(artifact.uri);
            let artifactEntity = await jobState.findEntity(artifactKey);

            if (!artifactEntity) {
              artifactEntity = createArtifactEntity(artifact, packageType);
              await jobState.addEntity(artifactEntity);
            } else {
              const duplicatedArtifact = createArtifactEntity(
                artifact,
                packageType,
              );
              const duplicateEntityReport = compareEntities(
                artifactEntity,
                duplicatedArtifact,
              );
              logger.error(duplicateEntityReport, 'Duplicate entity report.');
            }

            const repoArtifactRelationship = createDirectRelationship({
              _class: RelationshipClass.HAS,
              from: repositoryEntity,
              to: artifactEntity,
            });

            if (!jobState.hasKey(repoArtifactRelationship._key)) {
              await jobState.addRelationship(repoArtifactRelationship);
            }
          },
        );
      }
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
