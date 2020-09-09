/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useEffect } from 'react';

import { useActions, useValues } from 'kea';
import { Route, Switch, useHistory, useLocation, useParams } from 'react-router-dom';
import { History, Location } from 'history';

// import { AppLogic } from '../../app_logic';
import { GROUP_SOURCE_PRIORITIZATION_PATH, GROUP_PATH } from '../../routes';
import { GroupLogic } from './group_logic';

import { ManageUsersModal } from './components/manage_users_modal';
import { SharedSourcesModal } from './components/shared_sources_modal';

import { GroupOverview } from './components/group_overview';
import { GroupSourcePrioritization } from './components/group_source_prioritization';

export const GroupRouter: React.FC = () => {
  const history = useHistory() as History;
  const { pathname } = useLocation() as Location;
  const { groupId } = useParams() as { groupId: string };
  const { initializeGroup, resetGroup } = useActions(GroupLogic);

  const { sharedSourcesModalModalVisible, manageUsersModalVisible } = useValues(GroupLogic);

  useEffect(() => {
    initializeGroup(groupId, history);
    resetGroup();
  }, []);

  useEffect(() => {
    // TODO: Make sure this works
    // resetFlashMessages();
  }, [pathname]);

  return (
    <>
      <Switch>
        <Route path={GROUP_SOURCE_PRIORITIZATION_PATH} component={GroupSourcePrioritization} />
        <Route path={GROUP_PATH} component={GroupOverview} />
      </Switch>
      {sharedSourcesModalModalVisible && <SharedSourcesModal />}
      {manageUsersModalVisible && <ManageUsersModal />}
    </>
  );
};
