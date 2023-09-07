import { useState, useEffect } from 'react';
import styled from '@emotion/styled';

// HOPR Components
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import Checkbox from '../../../future-hopr-lib-components/Toggles/Checkbox';
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import Button from '../../../future-hopr-lib-components/Button';

// Mui
import { DialogTitle, DialogActions, CircularProgress, TextField, Tooltip } from '@mui/material';

import { SendMessagePayloadType } from '@hoprnet/hopr-sdk';
import CloseIcon from '@mui/icons-material/Close';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';

// Store
import { useAppDispatch, useAppSelector } from '../../../store';
import { actionsAsync } from '../../../store/slices/node/actionsAsync';

const PathOrHops = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
`;

const StatusContainer = styled.div`
  height: 32px;
`;

type SendMessageModalProps = {
  peerId?: string;
};

export const SendMessageModal = ({ peerId }: SendMessageModalProps) => {
  const dispatch = useAppDispatch();
  const [path, set_path] = useState<string>('');
  const [loader, set_loader] = useState<boolean>(false);
  const [status, set_status] = useState<string>('');
  const [numberOfHops, set_numberOfHops] = useState<number | ''>('');
  const [sendMode, set_sendMode] = useState<'path' | 'automaticPath' | 'numberOfHops' | 'directMessage'>('directMessage');
  const [automaticPath, set_automaticPath] = useState<boolean>(false);
  const [directMessage, set_directMessage] = useState<boolean>(true);
  const [message, set_message] = useState<string>('');
  const [receiver, set_receiver] = useState<string>(peerId ? peerId : '');
  const [openModal, set_openModal] = useState<boolean>(false);

  const maxLength = 500;
  const remainingChars = maxLength - message.length;

  const nonAutomaticPathTooltip = 'Disable `direct message` and `automatic path` to enable this field';

  const loginData = useAppSelector((store) => store.auth.loginData);
  const aliases = useAppSelector((store) => store.node.aliases.data);

  useEffect(() => {
    switch (sendMode) {
      case 'path':
        set_automaticPath(false);
        set_numberOfHops('');
        break;
      case 'numberOfHops':
      case 'directMessage':
        set_automaticPath(false);
        set_path('');
        break;
      default: //'automaticPath'
        set_numberOfHops('');
        set_path('');
    }
  }, [sendMode, path, automaticPath, numberOfHops]);

  const handleSendMessage = () => {
    if (!(loginData.apiEndpoint && loginData.apiToken)) return;
    set_status('');
    set_loader(true);
    const validatedReceiver = validatePeerId(receiver);

    let messagePayload: SendMessagePayloadType = {
      apiToken: loginData.apiToken,
      apiEndpoint: loginData.apiEndpoint,
      body: message,
      peerId: validatedReceiver,
      tag: 1,
    };

    if (sendMode === 'directMessage') {
      messagePayload.path = [];
    } else if (numberOfHops !== '') {
      messagePayload.hops = numberOfHops;
    } else if (path !== '') {
      const pathElements = path.replace(/(\r\n|\n|\r| )/gm, '').split(',');
      const validatedPath = pathElements.map((element) => validatePeerId(element));
      messagePayload.path = validatedPath;
    }

    dispatch(actionsAsync.sendMessageThunk(messagePayload))
      .unwrap()
      .then((res) => {
        console.log('@message: ', res?.challenge);
        set_status('Message sent');
        handleCloseModal();
      })
      .catch((e) => {
        console.log('@message err:', e);
        set_status(e.error);
      })
      .finally(() => {
        set_loader(false);
      });
  };

  const handleDirectMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_sendMode('directMessage');
    set_directMessage(event.target.checked);
    set_automaticPath(false);
  };

  const handleAutomaticPath = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_sendMode('automaticPath');
    set_automaticPath(event.target.checked);
    set_directMessage(false);
  };

  const handlePath = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_sendMode('path');
    set_path(event.target.value);
  };

  const handleNumberOfHops = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_sendMode('numberOfHops');
    set_numberOfHops(
      parseInt(event.target.value) || parseInt(event.target.value) === 0 ? parseInt(event.target.value) : ''
    );
  };

  const handleOpenModal = () => {
    set_openModal(true);
  };

  const handleCloseModal = () => {
    set_sendMode('automaticPath');
    set_numberOfHops('');
    set_message('');
    set_receiver(peerId ? peerId : '');
    set_path('');
    set_openModal(false);
    set_status('');
  };

  const isAlias = (alias: string) => {
    if (aliases) {
      return !!aliases[alias];
    } else return false;
  };

  const validatePeerId = (receiver: string) => {
    if (aliases && isAlias(receiver)) {
      return aliases[receiver];
    }
    return receiver;
  };

  return (
    <>
      <IconButton
        iconComponent={<ForwardToInboxIcon />}
        tooltipText={
          <span>
            SEND
            <br />
            message
          </span>
        }
        onClick={handleOpenModal}
      />

      <SDialog
        open={openModal}
        onClose={handleCloseModal}
        disableScrollLock={true}
        maxWidth={'800px'}
      >
        <TopBar>
          <DialogTitle>Send Message</DialogTitle>
          <SIconButton
            aria-label="close modal"
            onClick={handleCloseModal}
          >
            <CloseIcon />
          </SIconButton>
        </TopBar>
        <SDialogContent
        >
          <TextField
            label="Receiver (Peer Id)"
            placeholder="16Uiu2..."
            value={receiver}
            onChange={(e) => set_receiver(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Message"
            placeholder="Hello Node..."
            multiline
            maxRows={4}
            rows={4}
            value={message}
            onChange={(e) => set_message(e.target.value)}
            inputProps={{ maxLength: maxLength }}
            helperText={`${remainingChars} characters remaining`}
            required
            fullWidth
          />
          <span style={{ margin: '0px 0px -6px' }}>Send mode:</span>
          <PathOrHops>
            <Checkbox
              label="Direct message"
              value={directMessage}
              onChange={handleDirectMessage}
            />
            or
            <Checkbox
              label="Automatic path"
              value={automaticPath}
              onChange={handleAutomaticPath}
            />
            or
            <Tooltip
              title={nonAutomaticPathTooltip}
              disableHoverListener={!(automaticPath || directMessage)}
            >
              <TextField
                style={{ width: '180px' }}
                type="number"
                label="Number of Hops"
                placeholder="1"
                value={numberOfHops}
                onChange={handleNumberOfHops}
                inputProps={{
                  min: 0,
                  max: 10,
                  step: 1,
                }}
                disabled={automaticPath || directMessage}
              />
            </Tooltip>
            or
            <Tooltip
              title={nonAutomaticPathTooltip}
              disableHoverListener={!(automaticPath || directMessage)}
            >
              <TextField
                label="Path"
                placeholder="16Uiu2...9cTYntS3, 16Uiu2...9cDFSAa"
                value={path}
                onChange={handlePath}
                disabled={automaticPath || directMessage}
                fullWidth
                sx={{ maxWidth: '240px' }}
              />
            </Tooltip>
          </PathOrHops>
        </SDialogContent>
        <DialogActions>
          <Button
            onClick={handleSendMessage}
            disabled={
              !directMessage && (!automaticPath && numberOfHops === '' && path === '') || message.length === 0 || receiver.length === 0
            }
            style={{
              width: '100%',
              marginTop: '8px',
            }}
          >
            Send
          </Button>
        </DialogActions>
        <StatusContainer>
          {loader && <CircularProgress />}
          {status}
        </StatusContainer>
      </SDialog>
    </>
  );
};
