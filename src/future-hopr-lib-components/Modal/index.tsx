import * as React from 'react';
import styled from '@emotion/styled';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';

import { Row } from '../Atoms/row';

import CloseIcon from '@mui/icons-material/Close';

const SDialog = styled(({ maxWidthCss, ...rest }: PropsStyled) => <Dialog {...rest} />)`
  .MuiPaper-root {
    max-width: ${(props) => (props.maxWidthCss ? props.maxWidthCss : '395px')};
    width: 100%;
    padding: 16px;
    font-family: 'Source Code Pro';
    font-style: normal;
    .modal-title {
      font-weight: 600;
    }
  }
`;

interface PropsStyled extends Omit<DialogProps, 'maxWidth'> {
  selectedValue?: any;
  maxWidthCss?: string;
}

const Content = styled.div``;

interface Props extends Omit<DialogProps, 'maxWidth'> {
  selectedValue?: any;
  maxWidth?: string;
}

const Modal: React.FC<Props> = (props) => {
  const { onClose, selectedValue, open, title, children, maxWidth, disableScrollLock } = props;

  const handleClose = (event: {}) => {
    // @ts-ignore
    onClose(event, 'escapeKeyDown');
  };

  return (
    <SDialog
      onClose={handleClose}
      open={open}
      maxWidthCss={maxWidth}
      disableScrollLock={disableScrollLock}
    >
      <Row>
        <div className="modal-title">{title}</div>
        <IconButton
          color="primary"
          aria-label="close modal"
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>
      </Row>
      <Content>{children}</Content>
    </SDialog>
  );
};

export default Modal;
