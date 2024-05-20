import {
  IntegrationStepExecutionContext,
  createIntegrationEntity,
  IntegrationStep,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig, ArtifactoryBuild } from '../types';
import { createAPIClient } from '../client';
import { getArtifactKey } from './repositories/converters';
import { entities, IngestionSources, relationships, Steps } from '../constants';

export function getBuildKey(name: string): string {
  return `artifactory_build:${name}`;
}

function createBuildEntity(build: ArtifactoryBuild) {
  return createIntegrationEntity({
    entityData: {
      source: build,
      assign: {
        _key: getBuildKey(build.name),
        _type: entities.BUILD._type,
        _class: entities.BUILD._class,
        name: build.name,
        webLink: build.uri,
      },
    },
  });
}

export async function fetchBuilds({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

  try {
    await apiClient.iterateBuilds(async (build) => {
      const buildEntity = createBuildEntity(build);
      if (!jobState.hasKey(buildEntity._key)) {
        await jobState.addEntity(buildEntity);
      }

      for (const artifactUri of build.artifacts) {
        const artifactKey = getArtifactKey(artifactUri);

        if (jobState.hasKey(artifactKey)) {
          await jobState.addRelationship(
            createDirectRelationship({
              _class: RelationshipClass.CREATED,
              fromKey: buildEntity._key,
              fromType: entities.BUILD._type,
              toKey: artifactKey,
              toType: entities.ARTIFACT_CODEMODULE._type,
            }),
          );
        }
      }
    });
  } catch (error) {
    if (error.status === 404) {
      logger.warn('No builds found');
    } else {
      throw error;
    }
  }
}

export const buildSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.BUILDS,
    name: 'Fetch Builds',
    entities: [entities.BUILD],
    relationships: [relationships.BUILD_CREATED_ARTIFACT_CODEMODULE],
    dependsOn: [Steps.ARTIFACTS],
    ingestionSourceId: IngestionSources.BUILDS,
    executionHandler: fetchBuilds,
  },
];
