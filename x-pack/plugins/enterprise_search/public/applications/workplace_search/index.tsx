/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useContext, useEffect } from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import { useActions, useValues } from 'kea';

import { WORKPLACE_SEARCH_PLUGIN } from '../../../common/constants';
import { IInitialAppData } from '../../../common/types';
import { KibanaContext, IKibanaContext } from '../index';
import { HttpLogic } from '../shared/http';
import { AppLogic } from './app_logic';
import { Layout } from '../shared/layout';
import { WorkplaceSearchNav } from './components/layout/nav';

import { SETUP_GUIDE_PATH } from './routes';

import { SetupGuide } from './views/setup_guide';
import { ErrorState } from './views/error_state';
import { NotFound } from '../shared/not_found';
import { Overview } from './views/overview';
import { GroupsRouter } from './views/groups';

export const WorkplaceSearch: React.FC<IInitialAppData> = (props) => {
  const { config } = useContext(KibanaContext) as IKibanaContext;
  return !config.host ? <WorkplaceSearchUnconfigured /> : <WorkplaceSearchConfigured {...props} />;
};

export const WorkplaceSearchConfigured: React.FC<IInitialAppData> = (props) => {
  const { hasInitialized } = useValues(AppLogic);
  const { initializeAppData } = useActions(AppLogic);
  const { errorConnecting } = useValues(HttpLogic);

  // TODO: Replace with real data
  const tempProps = {
    ...props,
    isFederatedAuth: false,
    organization: {
      name: 'FIXME',
      defaultOrgName: 'Cats',
    },
    account: {
      id: 'id',
      groups: [],
      isAdmin: true,
      isCurated: false,
      canCreatePersonalSources: true,
      viewedOnboardingPage: true,
    },
  };

  useEffect(() => {
    if (!hasInitialized) initializeAppData(tempProps);
  }, [hasInitialized]);

  return (
    <Switch>
      <Route path={SETUP_GUIDE_PATH}>
        <SetupGuide />
      </Route>
      <Route exact path="/">
        {errorConnecting ? <ErrorState /> : <Overview />}
      </Route>
      <Route>
        <Layout navigation={<WorkplaceSearchNav />}>
          {errorConnecting ? (
            <ErrorState />
          ) : (
            <Switch>
              <Route path="/groups">
                <GroupsRouter />
              </Route>
              <Route>
                <NotFound product={WORKPLACE_SEARCH_PLUGIN} />
              </Route>
            </Switch>
          )}
        </Layout>
      </Route>
    </Switch>
  );
};

export const WorkplaceSearchUnconfigured: React.FC = () => (
  <Switch>
    <Route exact path={SETUP_GUIDE_PATH}>
      <SetupGuide />
    </Route>
    <Route>
      <Redirect to={SETUP_GUIDE_PATH} />
    </Route>
  </Switch>
);
