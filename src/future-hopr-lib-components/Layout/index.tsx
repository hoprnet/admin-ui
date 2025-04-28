/// <reference types="vite-plugin-svgr/client" />
// Packages
import React, { ReactNode, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { Outlet } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import { environment } from '../../../config';

// Components
import NavBar from '../Navbar/navBar';
import Footer from './footer';
import Drawer from './drawer';

// Types
import { ApplicationMapType } from '../../router';
import { useAppSelector } from '../../store';
import { loadStateFromLocalStorage, saveStateToLocalStorage } from '../../utils/localStorage';

const SLayout = styled.div`
  &.webapp {
    .Section.full-height-min {
      min-height: calc(100vh - 60px - 80px + 40px);
    }
  }
`;

type ContentType = {
  openedNavigationDrawer: boolean;
  tallerNavBarOnMobile?: boolean;
  drawerRight: boolean;
};

const Content = styled.div<ContentType>`
  margin-top: 60px;
  margin-left: 0;

  transition: margin-left 0.4s ease-out;
  @media (min-width: 500px) {
    margin-left: ${(props) => (props.openedNavigationDrawer ? '240px' : '56px')};
  }

  ${(props) =>
    props.tallerNavBarOnMobile &&
    css`
      @media screen and (max-width: 520px) {
        margin-top: 0px;
      }
    `}

  ${(props) =>
    props.drawerRight &&
    css`
      @media screen and (min-width: 740px) {
        margin-right: 233px;
      }
    `}
`;

const Layout: React.FC<{
  className?: string;
  itemsNavbarRight?: any;
  tallerNavBarOnMobile?: boolean;
  children?: ReactNode;
  drawer?: boolean;
  webapp?: boolean;
  drawerLoginState?: {
    node?: boolean;
    web3?: boolean;
    safe?: boolean;
  };
  drawerType?: 'blue' | 'white';
  drawerItems: ApplicationMapType;
  drawerFunctionItems?: ApplicationMapType;
  drawerRight?: React.ReactNode;
  drawerNumbers?: {
    [key: string]: number | string | undefined | null;
  };
  drawerNumbersLoading?: {
    [key: string]: boolean;
  };
}> = ({
  className = '',
  children,
  itemsNavbarRight,
  tallerNavBarOnMobile,
  drawer,
  drawerItems,
  webapp,
  drawerLoginState,
  drawerRight,
  drawerType,
  drawerFunctionItems,
  drawerNumbers,
  drawerNumbersLoading,
}) => {
  const isMobile = !useMediaQuery('(min-width: 500px)');
  const isConnected = useAppSelector((store) => store.auth.status.connected);
  const initialDrawerState = loadStateFromLocalStorage('drawerState');

  // const [openedNavigationDrawerPC, set_openedNavigationDrawerPC] = useState(environment === 'web3' || environment === 'dev' ? true : false);
  const [openedNavigationDrawerPC, set_openedNavigationDrawerPC] = useState(
    initialDrawerState !== null
      ? Boolean(initialDrawerState)
      : environment === 'web3' || environment === 'dev'
      ? true
      : false,
  );
  const [openedNavigationDrawerMobile, set_openedNavigationDrawerMobile] = useState(
    initialDrawerState !== null ? Boolean(initialDrawerState) : false,
  );

  const handleOpenedNavigationDrawer = (bool: boolean) => {
    if (isMobile) set_openedNavigationDrawerMobile(bool);
    else set_openedNavigationDrawerPC(bool);
    saveStateToLocalStorage('drawerState', bool);
  };

  useEffect(() => {
    if (isConnected) {
      set_openedNavigationDrawerPC(true);
      saveStateToLocalStorage('drawerState', true);
    }
  }, [isConnected]);
  return (
    <SLayout
      className={`Layout${webapp ? ' webapp' : ''} ${className} ${isMobile ? 'drawerHidden' : ''} ${
        (isMobile ? openedNavigationDrawerMobile : openedNavigationDrawerPC) ? 'drawerOpen' : 'drawerClosed'
      }`}
    >
      <NavBar
        mainLogo="/logo.svg"
        mainLogoAlt="hopr logo"
        itemsNavbarRight={itemsNavbarRight}
        tallerNavBarOnMobile={tallerNavBarOnMobile}
        webapp={webapp}
        set_openedNavigationDrawer={handleOpenedNavigationDrawer}
        openedNavigationDrawer={isMobile ? openedNavigationDrawerMobile : openedNavigationDrawerPC}
      />
      {drawer && (
        <Drawer
          drawerType={drawerType}
          drawerItems={drawerItems}
          drawerFunctionItems={drawerFunctionItems}
          drawerLoginState={drawerLoginState}
          drawerNumbers={drawerNumbers}
          drawerNumbersLoading={drawerNumbersLoading}
          set_openedNavigationDrawer={handleOpenedNavigationDrawer}
          openedNavigationDrawer={isMobile ? openedNavigationDrawerMobile : openedNavigationDrawerPC}
        />
      )}
      <Content
        className={`Content ${drawerRight ? 'drawerRight' : ''}`}
        openedNavigationDrawer={isMobile ? openedNavigationDrawerMobile : openedNavigationDrawerPC}
        drawerRight={!!drawerRight}
      >
        {' '}
        <div>
          <Outlet />
        </div>
        {/* {children} */}
      </Content>
      {drawerRight}
      {/* <Footer /> */}
    </SLayout>
  );
};

export default Layout;
