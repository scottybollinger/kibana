/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import uuid from 'uuid';

import { FtrProviderContext } from '../../../api_integration/ftr_provider_context';
import { getSupertestWithoutAuth, setupFleetAndAgents, getEsClientForAPIKey } from './services';
import { skipIfNoDockerRegistry } from '../../helpers';

export default function (providerContext: FtrProviderContext) {
  const { getService } = providerContext;

  const esArchiver = getService('esArchiver');
  const esClient = getService('es');
  const kibanaServer = getService('kibanaServer');
  const supertestWithAuth = getService('supertest');
  const supertest = getSupertestWithoutAuth(providerContext);

  let apiKey: { id: string; api_key: string };
  let kibanaVersion: string;

  describe('fleet_agents_enroll', () => {
    skipIfNoDockerRegistry(providerContext);
    before(async () => {
      await esArchiver.load('fleet/agents');

      const { body: apiKeyBody } = await esClient.security.createApiKey<typeof apiKey>({
        body: {
          name: `test access api key: ${uuid.v4()}`,
        },
      });
      apiKey = apiKeyBody;
      const {
        body: { _source: enrollmentApiKeyDoc },
      } = await esClient.get({
        index: '.fleet-enrollment-api-keys',
        id: 'ed22ca17-e178-4cfe-8b02-54ea29fbd6d0',
      });
      // @ts-ignore
      enrollmentApiKeyDoc.api_key_id = apiKey.id;
      await esClient.update({
        index: '.fleet-enrollment-api-keys',
        id: 'ed22ca17-e178-4cfe-8b02-54ea29fbd6d0',
        refresh: true,
        body: {
          doc: enrollmentApiKeyDoc,
        },
      });
      const kibanaVersionAccessor = kibanaServer.version;
      kibanaVersion = await kibanaVersionAccessor.get();
    });
    setupFleetAndAgents(providerContext);
    after(async () => {
      await esArchiver.unload('fleet/agents');
    });

    it('should not allow enrolling in a managed policy', async () => {
      // update existing policy to managed
      await supertestWithAuth
        .put(`/api/fleet/agent_policies/policy1`)
        .set('kbn-xsrf', 'xxxx')
        .send({
          name: 'Test policy',
          namespace: 'default',
          is_managed: true,
        })
        .expect(200);

      // try to enroll in managed policy
      const { body } = await supertest
        .post(`/api/fleet/agents/enroll`)
        .set('kbn-xsrf', 'xxx')
        .set(
          'Authorization',
          `ApiKey ${Buffer.from(`${apiKey.id}:${apiKey.api_key}`).toString('base64')}`
        )
        .send({
          type: 'PERMANENT',
          metadata: {
            local: {
              elastic: { agent: { version: kibanaVersion } },
            },
            user_provided: {},
          },
        })
        .expect(400);

      expect(body.message).to.contain('Cannot enroll in managed policy');

      // restore to original (unmanaged)
      await supertestWithAuth
        .put(`/api/fleet/agent_policies/policy1`)
        .set('kbn-xsrf', 'xxxx')
        .send({
          name: 'Test policy',
          namespace: 'default',
          is_managed: false,
        })
        .expect(200);
    });

    it('should not allow to enroll an agent with a invalid enrollment', async () => {
      await supertest
        .post(`/api/fleet/agents/enroll`)
        .set('kbn-xsrf', 'xxx')
        .set('Authorization', 'ApiKey NOTAVALIDKEY')
        .send({
          type: 'PERMANENT',
          metadata: {
            local: {
              elastic: { agent: { version: kibanaVersion } },
            },
            user_provided: {},
          },
        })
        .expect(401);
    });

    it('should not allow to enroll an agent with a version > kibana', async () => {
      const { body: apiResponse } = await supertest
        .post(`/api/fleet/agents/enroll`)
        .set('kbn-xsrf', 'xxx')
        .set(
          'authorization',
          `ApiKey ${Buffer.from(`${apiKey.id}:${apiKey.api_key}`).toString('base64')}`
        )
        .send({
          shared_id: 'agent2_filebeat',
          type: 'PERMANENT',
          metadata: {
            local: {
              elastic: { agent: { version: '999.0.0' } },
            },
            user_provided: {},
          },
        })
        .expect(400);
      expect(apiResponse.message).to.match(/is not compatible/);
    });

    it('should allow to enroll an agent with a valid enrollment token', async () => {
      const { body: apiResponse } = await supertest
        .post(`/api/fleet/agents/enroll`)
        .set('kbn-xsrf', 'xxx')
        .set(
          'Authorization',
          `ApiKey ${Buffer.from(`${apiKey.id}:${apiKey.api_key}`).toString('base64')}`
        )
        .send({
          type: 'PERMANENT',
          metadata: {
            local: {
              elastic: { agent: { version: kibanaVersion } },
            },
            user_provided: {},
          },
        })
        .expect(200);
      expect(apiResponse.item).to.have.keys('id', 'active', 'access_api_key', 'type', 'policy_id');
    });

    it('when enrolling an agent it should generate an access api key with limited privileges', async () => {
      const { body: apiResponse } = await supertest
        .post(`/api/fleet/agents/enroll`)
        .set('kbn-xsrf', 'xxx')
        .set(
          'Authorization',
          `ApiKey ${Buffer.from(`${apiKey.id}:${apiKey.api_key}`).toString('base64')}`
        )
        .send({
          type: 'PERMANENT',
          metadata: {
            local: {
              elastic: { agent: { version: kibanaVersion } },
            },
            user_provided: {},
          },
        })
        .expect(200);

      const { body: privileges } = await getEsClientForAPIKey(
        providerContext,
        apiResponse.item.access_api_key
      ).security.hasPrivileges({
        body: {
          cluster: ['all', 'monitor', 'manage_api_key'],
          index: [
            {
              names: ['log-*', 'metrics-*', 'events-*', '*'],
              privileges: ['write', 'create_index'],
            },
          ],
        },
      });
      expect(privileges.cluster).to.eql({
        all: false,
        monitor: false,
        manage_api_key: false,
      });
      expect(privileges.index).to.eql({
        '*': {
          create_index: false,
          write: false,
        },
        'events-*': {
          create_index: false,
          write: false,
        },
        'log-*': {
          create_index: false,
          write: false,
        },
        'metrics-*': {
          create_index: false,
          write: false,
        },
      });
    });
  });
}
