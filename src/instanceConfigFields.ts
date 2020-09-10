import { IntegrationInstanceConfigFieldMap } from '@jupiterone/integration-sdk-core';

const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  clientNamespace: {
    type: 'string',
  },
  clientAccessToken: {
    type: 'string',
    mask: true,
  },
  clientPipelineAccessToken: {
    type: 'string',
    mask: true,
  },
  clientAdminName: {
    type: 'string',
  },
};

export default instanceConfigFields;
