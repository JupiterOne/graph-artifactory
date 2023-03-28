import { ArtifactEntity } from '../../types';
import { entities } from '../../constants';
import {
  createIntegrationEntity,
  Entity,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';

export function getArtifactKey(uri: string): string {
  return `artifactory_artifact:${uri}`;
}

export function createArtifactEntity(
  artifact: ArtifactEntity,
  packageType: string,
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: artifact,
      assign: {
        _key: getArtifactKey(artifact.uri),
        _type: entities.ARTIFACT_CODEMODULE._type,
        _class: entities.ARTIFACT_CODEMODULE._class,
        name: artifact.name,
        displayName: artifact.uri,
        webLink: artifact.uri,
        packageType,
        size: artifact.size,
        createdOn: parseTimePropertyValue(artifact.created),
        createdBy: artifact.created_by,
        modifiedOn: parseTimePropertyValue(artifact.modified),
        modifiedBy: artifact.modified_by,
        updatedOn: parseTimePropertyValue(artifact.updated),
      },
    },
  });
}
