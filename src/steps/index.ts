import { accountSteps } from './account';
import { accessSteps } from './access';
import { repositoriesSteps } from './repositories';
import { permissionsSteps } from './permissions';
import { buildSteps } from './builds';
import { pipelineSourcesSteps } from './pipelineSources';

const integrationSteps = [
  ...accountSteps,
  ...accessSteps,
  ...repositoriesSteps,
  ...permissionsSteps,
  ...buildSteps,
  ...pipelineSourcesSteps,
];

export { integrationSteps };
