import React from 'react';
import styled from '@emotion/styled';
//import { useRouter } from 'next/router';

import MuiButton from '@mui/material/Button';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MuiMenu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';

const SButton = styled(MuiButton)`
  text-transform: none;
  color: #000050;
  font-size: 14px;
  font-weight: 500;
  min-width: unset;
  ${(props) => props.background && `background-color: ${props.background};`}
  .MuiButton-endIcon {
    margin-left: 0;
    transition: all 0.5s;
  }
  &.openMenu {
    .MuiButton-endIcon {
      transform: rotate(180deg);
    }
  }
  &:hover {
    background-color: rgba(25, 118, 210, 0.2);
  }
`;

const SMenu = styled(MuiMenu)`
  .MuiPaper-root {
    border-radius: 10px;
  }
  color: #000050;
`;

const SMuiMenuItem = styled(MuiMenuItem)`
  color: #000050;
  font-size: 14px;
  font-weight: 500;
`;

export default function Button(props) {
  const { subMenu, ...rest } = props;
  //  const router = useRouter();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    if (props.path && !props.subMenu) {
      //     router.push(props.path);
      props.onButtonClick(props.path);
    } else if (props.subMenu) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClickSub = (path) => {
    //  router.push(path);
    handleClose();
    props.onButtonClick && props.onButtonClick(path);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <SButton
        id={props.id}
        variant="text"
        className={`${props.className} ${open ? 'openMenu' : 'closedMenu'}`}
        endIcon={props.subMenu && <KeyboardArrowDownIcon />}
        onClick={handleClick}
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup={props.subMenu ? 'true' : 'false'}
        aria-expanded={open ? 'true' : undefined}
        background={props.background}
        {...rest}
      >
        {props.children}
      </SButton>
      {props.subMenu && (
        <SMenu
          id={`${props.id}-menu`}
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{ 'aria-labelledby': props.id }}
        >
          {props.subMenu.map((item, index) => (
            <SMuiMenuItem
              key={`itemsNavbarSub-${props.label}-${index}`}
              onClick={() => handleClickSub(item.path)}
            >
              {item.name}
            </SMuiMenuItem>
          ))}
        </SMenu>
      )}
    </div>
  );
}

Button.defaultProps = {};
