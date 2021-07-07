import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  createDirectRelationship,
  Entity,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig } from '../types';
import {
  ACCOUNT_ENTITY_DATA_KEY,
  entities,
  relationships,
  Steps,
} from '../constants';

export function getPipelineSourceKey(id: number): string {
  return `artifactory_pipeline_source:${id}`;
}

export async function fetchPipelineSources({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity: Entity = await jobState.getData(ACCOUNT_ENTITY_DATA_KEY);

  await apiClient.iteratePipelineSources(async (source) => {
    const pipelineSource = createIntegrationEntity({
      entityData: {
        source: { ...source, id: source.id.toString() },
        assign: {
          _key: getPipelineSourceKey(source.id),
          _type: entities.PIPELINE_SOURCE._type,
          _class: entities.PIPELINE_SOURCE._class,
          name: getPipelineSourceKey(source.id),
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
    executionHandler: fetchPipelineSources,
  },
];
