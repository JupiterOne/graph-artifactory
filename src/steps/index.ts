import { accountSteps } from './account';
import { accessSteps } from './access';
import { repositoriesSteps } from './repositories';

const integrationSteps = [
  ...accountSteps,
  ...accessSteps,
  ...repositoriesSteps,
];

export { integrationSteps };
