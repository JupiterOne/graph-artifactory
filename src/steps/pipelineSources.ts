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
  IngestionSources,
  relationships,
  Steps,
} from '../constants';
import { IntegrationConfig } from '../types';

export function getPipelineSourceKey(id: number): string {
  return `artifactory_pipeline_source:${id}`;
}

export async function fetchPipelineSources({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(logger, instance.config);

  const accountEntity = (await jobState.getData(
    ACCOUNT_ENTITY_DATA_KEY,
  )) as Entity;

  await apiClient.iteratePipelineSources(async (source) => {
    const pipelineSource = createIntegrationEntity({
      entityData: {
        source,
        assign: {
          _key: getPipelineSourceKey(source.id),
          _type: entities.PIPELINE_SOURCE._type,
          _class: entities.PIPELINE_SOURCE._class,
          name: getPipelineSourceKey(source.id),
          id: String(source.id),
          createdBy: String(source.createdBy),
          updatedBy: String(source.updatedBy),
        },
      },
    });

    await Promise.all([
      jobState.addEntity(pipelineSource),
      jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: accountEntity,
          to: pipelineSource,
        }),
      ),
    ]);
  });
}

export const pipelineSourcesSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: Steps.PIPELINE_SOURCES,
    name: 'Fetch Pipeline Sources',
    entities: [entities.PIPELINE_SOURCE],
    relationships: [relationships.ACCOUNT_HAS_PIPELINE_SOURCE],
    dependsOn: [Steps.ACCOUNT],
    ingestionSourceId: IngestionSources.PIPELINE_SOURCES,
    executionHandler: fetchPipelineSources,
  },
];
