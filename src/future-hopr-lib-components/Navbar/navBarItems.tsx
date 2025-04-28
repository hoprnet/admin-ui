import React from 'react';
import styled from '@emotion/styled';
import NavButton from './navButton';

const Content = styled.div`
  align-items: center;
  &.menu-right:not(.menu-webpapp) {
    margin-right: 8px;
    gap: 5px;
  }
  &.menu-mobile {
    display: flex;
    gap: 5px;
    flex-direction: column;
    align-items: center;
  }
`;

type NavBarItemsProps = {
  className?: string;
  center?: boolean;
  webapp?: boolean;
  right?: boolean;
  mobile?: boolean;
  itemsNavbar?: any[];
  onButtonClick?: any;
};

const NavBarItems = ({ className, center, webapp, right, mobile, itemsNavbar, onButtonClick }: NavBarItemsProps) => {
  const position = center ? 'center' : right ? 'right' : mobile ? 'mobile' : 'position-undefined';

  return (
    <Content className={['menu', `menu-${position}`, webapp ? 'menu-webpapp' : ''].join(' ')}>
      {/*  @ts-ignore */}
      {itemsNavbar &&
        itemsNavbar[0]?.label &&
        itemsNavbar.map((item, i) => (
          <NavButton
            key={`itemsNavbar-${position}-${i}`}
            id={`itemsNavbar-${position}-${i}`}
            path={item.path}
            subMenu={item.subMenu}
            label={item.name}
            background={item.background}
            onButtonClick={onButtonClick}
          >
            {item.name}
          </NavButton>
        ))}
      {itemsNavbar}
    </Content>
  );
};

export default NavBarItems;

NavBarItems.defaultProps = { itemsNavbar: [] };
