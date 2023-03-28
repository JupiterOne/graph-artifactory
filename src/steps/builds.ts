import {
  IntegrationStepExecutionContext,
  createIntegrationEntity,
  IntegrationStep,
  createDirectRelationship,
  JobState,
  Entity,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig, ArtifactoryBuild } from '../types';
import { createAPIClient } from '../client';
import { getArtifactKey } from './repositories/converters';
import { entities, relationships, Steps } from '../constants';

export function getBuildKey(name: string): string {
  return `artifactory_build:${name}`;
}

async function createBuildEntity(
  jobState: JobState,
  build: ArtifactoryBuild,
): Promise<Entity> {
  const buildEntity = createIntegrationEntity({
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

  return jobState.addEntity(buildEntity);
}

export async function fetchBuilds({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

  await apiClient.iterateBuilds(async (build) => {
    const buildEntity =
      (await jobState.findEntity(getBuildKey(build.name))) ||
      (await createBuildEntity(jobState, build));

    for (const artifactUri of build.artifacts) {
      const artifactEntity = await jobState.findEntity(
        getArtifactKey(artifactUri),
      );

      if (artifactEntity) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.CREATED,
            from: buildEntity,
            to: artifactEntity,
          }),
        );
      }
    }
  });
}

export const buildSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.BUILDS,
    name: 'Fetch Builds',
    entities: [entities.BUILD],
    relationships: [relationships.BUILD_CREATED_ARTIFACT_CODEMODULE],
    dependsOn: [Steps.ARTIFACTS],
    executionHandler: fetchBuilds,
  },
];
