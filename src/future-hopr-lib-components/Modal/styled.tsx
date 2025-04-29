import styled from '@emotion/styled';
import { Dialog, DialogContent, IconButton } from '@mui/material';

export const SDialog = styled(({ maxWidth, ...rest }: any) => <Dialog {...rest} />)`
  .MuiPaper-root {
    width: 100%;
    ${(props) =>
      props.maxWidth &&
      `
      max-width: ${props.maxWidth};
    `}
  }
`;

export const TopBar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const SDialogContent = styled(DialogContent)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  &.error-message {
    white-space: break-spaces;
    line-height: 2;
  }
`;

export const SIconButton = styled(IconButton)`
  height: 32px;
  width: 32px;
  margin: 16px;
`;
