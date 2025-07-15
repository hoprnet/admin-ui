import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWatcher } from '../../hooks';

// Mui
import MuiIconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DeleteIcon from '@mui/icons-material/Delete';

// HOPR Components
import IconButton from '../../future-hopr-lib-components/Button/IconButton';

// Store
import { useAppDispatch, useAppSelector } from '../../store';
import { appActions } from '../../store/slices/app';

const Container = styled.div`
  height: 42px;
  width: 42px;
  border-left: 1px lightgray solid;
  border-right: 1px lightgray solid;
`;

const SBadge = styled(Badge)`
  width: 100%;
  height: 100%;
  .MuiBadge-badge {
    transform: scale(0.9) translate(-11%, 27%);
    background-color: #0000b4;
  }
`;

const SIconButton = styled(MuiIconButton)`
  width: 100%;
  height: 100%;
  border-radius: 0;
  svg {
    width: 38px;
    height: 38px;
  }
`;

const SMenuItem = styled(MenuItem)`
  width: 100%;
  max-width: 350px;
  padding-right: 21px;
  white-space: break-spaces;
  overflow-wrap: anywhere;
  font-size: 14px;
  &:not(:last-child) {
    border-bottom: 1px solid #8f8f8f;
  }
  &.unreadMenuItem {
    background-color: rgba(25, 118, 210, 0.15);
    opacity: 90%;
    &:after {
      content: '';
      display: block;
      position: absolute;
      width: 8px;
      height: 8px;
      right: 11px;
      -moz-border-radius: 7.5px;
      -webkit-border-radius: 7.5px;
      border-radius: 7.5px;
      background-color: rgb(56, 88, 152);
    }
  }
  &.informational {
    font-size: 12px;
    background-color: rgb(255 143 143 / 39%);
    cursor: default;
    pointer-events: none;
    justify-content: space-between;
    button {
      pointer-events: all;
    }
  }
`;

export default function NotificationBar() {
  // start watching notifications
  useWatcher({});

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const searchParams = useLocation()?.search;
  const { notifications } = useAppSelector((store) => store.app);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (notification: (typeof notifications)[0]) => {
    setAnchorEl(null);
    dispatch(appActions.markSeenAllNotifications());
  };

  return (
    <Container>
      <SBadge
        id="notification-menu-button"
        badgeContent={notifications.filter((notification) => !notification.seen).length}
        color="secondary"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <SIconButton>
          <NotificationsNoneIcon />
        </SIconButton>
      </SBadge>
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'notification-menu-button',
          className: 'notification-menu-list',
        }}
        disableScrollLock={true}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {notifications.length > 0 && (
          <SMenuItem
            className={'informational'}
            //            style={{ maxWidth: 'calc(100% - 17px)'}} //TODO: Fix notification drodown styling if we have more notifications than fit can on the screen
            // https://github.com/hoprnet/hopr-admin/issues/567
          >
            Notifications are stored locally.
            <br />
            They will delete on refresh.
            <IconButton
              iconComponent={<DeleteIcon />}
              tooltipText="CLEAR"
              onClick={() => {
                dispatch(appActions.clearNotifications());
              }}
            />
          </SMenuItem>
        )}
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <SMenuItem
              className={!notification.interacted ? 'unreadMenuItem' : ''}
              key={notification.id}
              //              style={{ maxWidth: 'calc(100% - 17px)'}}
              onClick={() => {
                dispatch(appActions.interactedWithNotification(notification.id));
                if (notification.url) {
                  navigate(`${notification.url}${searchParams ? searchParams : ''}`);
                }
              }}
            >
              {notification.name}
            </SMenuItem>
          ))
        ) : (
          <SMenuItem>No notifications</SMenuItem>
        )}
      </Menu>
    </Container>
  );
}
