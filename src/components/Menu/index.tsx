import { useEffect } from 'react';
import styled from '@emotion/styled';
import MuiMenu, { MenuProps } from '@mui/material/Menu';

const SMenu = styled(MuiMenu)``;

export default function Menu(props: MenuProps) {
  useEffect(() => {
    const bodyHeight = document.getElementsByTagName('body')[0].clientHeight;
    const windowHeight = window.innerHeight;

    if (props.open && bodyHeight > windowHeight) {
      document.body.classList.add('menu-opened');
    } else {
      document.body.classList.remove('menu-opened');
    }
  }, [props.open]);

  return <MuiMenu {...props} />;
}
