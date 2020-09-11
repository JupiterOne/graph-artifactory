import { constructPermissionsMap } from './permissions';
import { ArtifactoryPermission } from '../types';

describe('constructPermissionsMap', () => {
  test('creates permission map', () => {
    const permission: ArtifactoryPermission = {
      name: 'Anything',
      repo: {
        repositories: ['ANY'],
        actions: {
          users: {
            anonymous: ['read'],
          },
          groups: {
            readers: ['read'],
          },
        },
        'include-patterns': ['**'],
        'exclude-patterns': [],
      },
      build: {
        repositories: ['artifactory-build-info'],
        actions: {
          users: {
            anonymous: ['read'],
          },
          groups: {
            readers: ['read'],
          },
        },
        'include-patterns': ['**'],
        'exclude-patterns': [],
      },
    };

    expect(constructPermissionsMap(permission, 'groups')).toEqual({
      readers: {
        permissions: {
          repositoryPermissions: {
            read: true,
          },
          buildPermissions: {
            read: true,
          },
        },
      },
    });

    expect(constructPermissionsMap(permission, 'users')).toEqual({
      anonymous: {
        permissions: {
          repositoryPermissions: {
            read: true,
          },
          buildPermissions: {
            read: true,
          },
        },
      },
    });
  });
});
