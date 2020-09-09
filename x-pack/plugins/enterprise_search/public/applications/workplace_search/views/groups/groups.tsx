/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useEffect } from 'react';

import { useActions, useValues } from 'kea';
import { Link } from 'react-router-dom';

import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner, EuiSpacer } from '@elastic/eui';

import { AppLogic } from '../../app_logic';

import { Loading } from '../../components/shared/loading';
import { ViewContentHeader } from '../../components/shared/view_content_header';

import { getGroupPath, USERS_PATH } from '../../routes';

import { useDidUpdateEffect } from '../../../shared/use_did_update_effect';
import { FlashMessages, FlashMessagesLogic } from '../../../shared/flash_messages';

import { GroupsLogic } from './groups_logic';

import { AddGroupModal } from './components/add_group_modal';
import { ClearFiltersLink } from './components/clear_filters_link';
import { GroupsTable } from './components/groups_table';
import { TableFilters } from './components/table_filters';

export const Groups: React.FC = () => {
  const { messages } = useValues(FlashMessagesLogic);

  const { getSearchResults, openNewGroupModal, resetGroups } = useActions(GroupsLogic);
  const {
    groupsDataLoading,
    newGroupModalOpen,
    newGroup,
    groupListLoading,
    hasFiltersSet,
    groupsMeta: {
      page: { current: activePage, total_results: numGroups },
    },
    filteredSources,
    filteredUsers,
    filterValue,
  } = useValues(GroupsLogic);

  const {
    isFederatedAuth,
    account: { isCurated, canCreateInvitations },
  } = useValues(AppLogic);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    getSearchResults(true);
    return resetGroups;
  }, [filteredSources, filteredUsers, filterValue]);

  // Because the initial search happens above, we want to skip the initial search and use the custom hook to do so.
  useDidUpdateEffect(() => {
    getSearchResults();
  }, [activePage]);

  if (groupsDataLoading) {
    return <Loading />;
  }

  if (newGroup && hasMessages) {
    messages[0].description = (
      <Link to={getGroupPath(newGroup.id)}>
        <EuiButton color="primary">Manage Group</EuiButton>
      </Link>
    );
  }

  const clearFilters = hasFiltersSet && <ClearFiltersLink />;
  const inviteUsersButton =
    !isFederatedAuth && (canCreateInvitations || isCurated) ? (
      <Link to={USERS_PATH}>
        <EuiButton data-test-subj="InviteUsersButton" color="primary" fill>
          Invite users
        </EuiButton>
      </Link>
    ) : null;

  const headerAction = (
    <EuiFlexGroup responsive={false} gutterSize="m">
      <EuiFlexItem grow={false}>
        <EuiButton
          data-test-subj="AddGroupButton"
          color="secondary"
          fill={true}
          onClick={openNewGroupModal}
        >
          Create a group
        </EuiButton>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{inviteUsersButton}</EuiFlexItem>
    </EuiFlexGroup>
  );

  const noResults = (
    <EuiFlexGroup justifyContent="spaceAround">
      <EuiFlexItem grow={!groupListLoading}>
        {groupListLoading ? (
          <EuiLoadingSpinner size="xl" />
        ) : (
          <>
            {clearFilters}
            <p>No results found. </p>
          </>
        )}
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <>
      <ViewContentHeader title="Organization groups" action={headerAction} />
      <EuiSpacer size="m" />
      {hasMessages && <FlashMessages />}
      <TableFilters />
      <EuiSpacer />
      {numGroups > 0 && !groupListLoading ? <GroupsTable /> : noResults}
      {newGroupModalOpen && <AddGroupModal />}
    </>
  );
};
