import * as dotenv from 'dotenv';
import * as path from 'path';

import { IntegrationConfig } from '../src/types';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}

export const integrationConfig: IntegrationConfig = {
  clientNamespace: process.env.CLIENT_NAMESPACE || 'codeworkr',
  clientAccessToken: process.env.CLIENT_ACCESS_TOKEN || 'codeworkr',
  enablePipelineIngestion: false,
  clientPipelineAccessToken:
    process.env.CLIENT_PIPELINE_ACCESS_TOKEN || 'codeworkr',
  clientAdminName: process.env.CLIENT_ADMIN_NAME || 'acmonta2@ncsu.edu',
};
