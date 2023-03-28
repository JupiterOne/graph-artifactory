import { Entity } from '@jupiterone/integration-sdk-core';
import { deepStrictEqual } from 'assert';

export function joinUrlPath(...paths: string[]): string {
  return paths
    .map((p) => p.replace(/^\/|\/$/g, ''))
    .filter((p) => p)
    .join('/');
}

/**
 * isDeepStrictEqual deeply compares two values and returns true if they are equal
 * @param a any
 * @param b any
 * @returns boolean representing if the two values are deeply equal
 */
function isDeepStrictEqual(a: any, b: any): boolean {
  try {
    deepStrictEqual(a, b);
    return true;
  } catch {
    return false;
  }
}

type DuplicateEntityReport = {
  _key: string;
  rawDataMatch: boolean;
  propertiesMatch: boolean;
};

export function compareEntities(a: Entity, b: Entity): DuplicateEntityReport {
  const aClone = JSON.parse(JSON.stringify(a));
  const bClone = JSON.parse(JSON.stringify(b));
  aClone._rawData = undefined;
  bClone._rawData = undefined;

  return {
    _key: a._key,
    rawDataMatch: isDeepStrictEqual(a._rawData, b._rawData),
    propertiesMatch: isDeepStrictEqual(aClone, bClone),
  };
}
