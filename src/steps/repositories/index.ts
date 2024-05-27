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
  IngestionSources,
  relationships,
  Steps,
} from '../../constants';
import { ArtifactEntity, IntegrationConfig } from '../../types';
import { createArtifactEntity } from './converters';

const REPO_KEYS_BATCH_SIZE = 100;

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

  const processArtifact = async (
    artifact: ArtifactEntity,
    repoEntityKey: string,
    packageType: string,
  ) => {
    const artifactEntity = createArtifactEntity(artifact, packageType);

    if (!jobState.hasKey(artifactEntity._key)) {
      await jobState.addEntity(artifactEntity);
    }

    const repoArtifactRelationship = createDirectRelationship({
      _class: RelationshipClass.HAS,
      fromKey: repoEntityKey,
      fromType: entities.REPOSITORY._type,
      toKey: artifactEntity._key,
      toType: entities.ARTIFACT_CODEMODULE._type,
    });

    if (!jobState.hasKey(repoArtifactRelationship._key)) {
      await jobState.addRelationship(repoArtifactRelationship);
    }
  };

  const processRepoKeysBatch = async (
    repoKeysMap: Map<string, { repoEntityKey: string; packageType: string }>,
  ) => {
    await apiClient.iterateRepositoryArtifacts(
      Array.from(repoKeysMap.keys()),
      async (artifact) => {
        const repoKey = artifact.repo;
        const repoKeyData = repoKeysMap.get(repoKey);
        if (!repoKeyData) {
          return;
        }
        const { repoEntityKey, packageType } = repoKeyData;
        await processArtifact(artifact, repoEntityKey, packageType);
      },
    );
  };

  const repoKeysMap = new Map<
    string,
    { repoEntityKey: string; packageType: string }
  >();

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
      const repoData = {
        packageType,
        repoEntityKey: repositoryEntity._key,
      };

      for (const repoKey of repositoryKeys) {
        if (repoType === 'VIRTUAL') {
          await apiClient.iterateRepositoryArtifacts(
            [repoKey],
            async (artifact) => {
              await processArtifact(
                artifact,
                repoData.repoEntityKey,
                repoData.packageType,
              );
            },
          );
        } else {
          repoKeysMap.set(repoKey, repoData);
          if (repoKeysMap.size >= REPO_KEYS_BATCH_SIZE) {
            await processRepoKeysBatch(repoKeysMap);
            repoKeysMap.clear();
          }
        }
      }
    },
  );

  if (repoKeysMap.size) {
    await processRepoKeysBatch(repoKeysMap);
    repoKeysMap.clear();
  }
}

export const repositoriesSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.REPOSITORIES,
    name: 'Fetch Repositories',
    entities: [entities.REPOSITORY],
    relationships: [relationships.ACCOUNT_HAS_REPOSITORY],
    dependsOn: [Steps.ACCOUNT],
    ingestionSourceId: IngestionSources.REPOSITORIES,
    executionHandler: fetchRepositories,
  },
  {
    id: Steps.GENERATE_REPOSITORY_GROUPS,
    name: 'Generate Repository Groups',
    entities: [entities.REPOSITORY_GROUP],
    relationships: [relationships.ACCOUNT_HAS_REPOSITORY_GROUP],
    dependsOn: [Steps.ACCOUNT],
    ingestionSourceId: IngestionSources.REPOSITORY_GROUPS,
    executionHandler: generateRepositoryGroups,
  },
  {
    id: Steps.ARTIFACTS,
    name: 'Fetch Artifacts',
    entities: [entities.ARTIFACT_CODEMODULE],
    relationships: [relationships.REPOSITORY_HAS_ARTIFACT_CODEMODULE],
    dependsOn: [Steps.REPOSITORIES],
    ingestionSourceId: IngestionSources.ARTIFACTS,
    executionHandler: fetchArtifacts,
  },
];
