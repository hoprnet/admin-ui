import React, { useEffect, useState } from 'react';
//import { useRouter } from 'next/router';
import styled from '@emotion/styled';

//import Sections from '../Sections';
//import LaunchPlaygroundBtn from '../../future-hopr-lib-components/Button/LaunchPlayground';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import NavBarItems from './navBarItems';
import { Box, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

interface AppBarProps extends MuiAppBarProps {
  tallerNavBarOnMobile?: boolean;
  webapp?: boolean;
}

const AppBar = styled(({ tallerNavBarOnMobile, webapp, ...rest }: AppBarProps) => <MuiAppBar {...rest} />)`
  background: white;
  height: 60px;
  border-bottom: 1px lightgray solid;
  box-shadow: unset;
  z-index: 1201;
  ${(props) =>
    !props.webapp &&
    `
    padding-left: 16px;
    padding-right: 16px;
  `}
  ${(props) =>
    props.tallerNavBarOnMobile &&
    `
    @media screen and (max-width: 520px) {
    //  height: 100px;
      position: static;
    }
  `}
`;

const Container = styled.div<{ webapp?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  ${(props) => !props.webapp && 'max-width: 1098px;'}
  width: 100%;
  margin-inline: 8px;
  position: relative;
  .menu {
    display: flex;
    flex-direction: row;
  }
`;

const FlexBox = styled(Box)`
  align-items: center;
  display: flex;
  gap: 1rem;

  .MuiIconButton-root {
    height: 48px;
    width: 48px;
    &:hover {
      background-color: rgba(0, 0, 180, 0.1);
      transition: background-color 0.4s ease;
    }
  }
`;

const Logo = styled.div`
  width: 92px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* a {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden; */
  img {
    height: 50px;
    width: auto;
    margin-left: 10px;
  }
  //  }
`;

const NavBar: React.FC<{
  className?: string;
  center?: boolean;
  webapp?: boolean;
  right?: boolean;
  mobile?: boolean;
  mainLogo?: string;
  mainLogoAlt?: string;
  tallerNavBarOnMobile?: boolean;
  itemsNavbarCenter?: any[];
  itemsNavbarRight?: any[];
  openedNavigationDrawer: boolean;
  onButtonClick?: () => void;
  set_openedNavigationDrawer: (openedNavigationDrawer: boolean) => void;
}> = (props) => {
  //  const router = useRouter();
  const [activaMenu, setActivaMenu] = useState(false);
  const [isScroll, setIsScroll] = useState(false);
  //const showCoinbase = router.pathname === '/' || router.pathname === '/token';

  const onScrollNavBar = function () {
    if (window.pageYOffset === 0) {
      setIsScroll(false);
    } else {
      setIsScroll(true);
      setActivaMenu(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', onScrollNavBar);
    return () => window.removeEventListener('scroll', onScrollNavBar);
  }, [isScroll]);

  return (
    <>
      <AppBar
        className="Hopr-navBar navbar"
        tallerNavBarOnMobile={props.tallerNavBarOnMobile}
        webapp={props.webapp}
      >
        <Container webapp={props.webapp}>
          <FlexBox>
            <IconButton onClick={() => props.set_openedNavigationDrawer(!props.openedNavigationDrawer)}>
              <MenuIcon />
            </IconButton>
            <Logo className="logo-hopr">
              {/* <a href="/"> */}
              <img
                className="logo-hopr-navbar"
                alt={props.mainLogoAlt}
                src={props.mainLogo}
              />
              {/* </a> */}
            </Logo>
          </FlexBox>
          <div
            onClick={() => setActivaMenu(!activaMenu)}
            className={'icon-menu' + (activaMenu ? ' open' : '')}
          >
            <span></span>
          </div>
          <NavBarItems
            itemsNavbar={props.itemsNavbarCenter}
            center
            webapp={props.webapp}
          />
          <NavBarItems
            itemsNavbar={props.itemsNavbarRight}
            right
            webapp={props.webapp}
          />
        </Container>
      </AppBar>
      <div className={`menu mobile ${activaMenu ? ' show-menu' : ''}`}>
        <NavBarItems
          //     itemsNavbar={[...props.itemsNavbarCenter, ...props.itemsNavbarRight]}
          onButtonClick={() => {
            setActivaMenu(false);
          }}
          mobile
        />
      </div>
    </>
  );
};

NavBar.defaultProps = {
  itemsNavbarCenter: [],
  itemsNavbarRight: [],
};

export default NavBar;
