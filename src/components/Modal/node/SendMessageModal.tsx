import { useState, useEffect } from 'react';
import styled from '@emotion/styled';

// HOPR Components
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import Button from '../../../future-hopr-lib-components/Button';

// Mui
import {
  DialogTitle,
  DialogActions,
  CircularProgress,
  TextField,
  SelectChangeEvent,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material'

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
  width: 100%;

  .numerOfHopsSelected{
    justify-content: center;
  }

  .noNumberOfHopsSelected{
    justify-content: flex-start;
  }

  .numerOfHops {
    flex: 1;
  }

  .noNumberOfHops {
    flex: 0.5;
  }

`;

const StatusContainer = styled.div`
  height: 32px;
`;

type SendMessageModalProps = {
  peerId?: string;
  disabled?: boolean;
};

export const SendMessageModal = (props: SendMessageModalProps) => {
  const dispatch = useAppDispatch();
  const [path, set_path] = useState<string>('');
  const [loader, set_loader] = useState<boolean>(false);
  const [status, set_status] = useState<string>('');
  const [numberOfHops, set_numberOfHops] = useState<number>(0);
  const [sendMode, set_sendMode] = useState<'path' | 'automaticPath' | 'numberOfHops' | 'directMessage'>('directMessage');
  const [message, set_message] = useState<string>('');
  const [openModal, set_openModal] = useState<boolean>(false);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const aliases = useAppSelector((store) => store.node.aliases.data);
  const peers = useAppSelector((store) => store.node.peers.data?.connected);
  const addresses = useAppSelector((store) => store.node.addresses.data);

  const peersAndOwnNode = peers && addresses.hopr && addresses.native ? [...peers, {
    peerId: addresses.hopr,
    peerAddress: addresses.native,
    multiAddr:"",
    lastSeen: 0,
    quality:0,
    backoff:0,
    isNew: false,
    reportedVersion:"",
    heartbeats: {
      sent: 0,
      success: 0,
    }
  }] : [];

  const [selectedReceiver, set_selectedReceiver] = useState<{
    peerId: string;
    peerAddress: string;
    quality: number;
    multiAddr: string;
    heartbeats: {
      sent: number;
      success: number;
    };
    lastSeen: number;
    backoff: number;
    isNew: boolean;
    reportedVersion: string;
  } | null>(props.peerId ? peers!.find(elem => elem.peerId === props.peerId) || null : null);

  const maxLength = 500;
  const remainingChars = maxLength - message.length;

  const setPropPeerId = () => {
    const reveiver = props.peerId ? peers!.find(elem => elem.peerId === props.peerId) || null : null;
    if (props.peerId) set_selectedReceiver(reveiver);
  };
  useEffect(setPropPeerId, [props.peerId]);

  useEffect(() => {
    switch (sendMode) {
      case 'path':
        set_numberOfHops(0);
        break;
      case 'numberOfHops':
        set_path('');
        break;
      default: //anything that is not a custom route
        set_numberOfHops(0);
        set_path('');
    }

  }, [sendMode, path, numberOfHops]);

  const handleSendMessage = () => {
    if (!(loginData.apiEndpoint && loginData.apiToken)) return;
    set_status('');
    set_loader(true);
    const validatedReceiver = validatePeerId(selectedReceiver!.peerId);

    const messagePayload: SendMessagePayloadType = {
      apiToken: loginData.apiToken,
      apiEndpoint: loginData.apiEndpoint,
      body: message,
      peerId: validatedReceiver,
      tag: 1,
    };

    if (sendMode === 'directMessage') {
      messagePayload.path = [];
    }
    if (sendMode === 'numberOfHops') {
      if (numberOfHops === 0) {
        messagePayload.path = [];
      } else {
        messagePayload.hops = numberOfHops;
      }
    }
    if (sendMode == 'path') {
      const pathElements: string[] = [];
      const lines = path.split('\n')
      for (const line of lines) {
        const elements = line.split(',').map((element) => element.trim()).filter((element) => element !== '');
        pathElements.push(...elements);
      }


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

  const handleSendModeChange = (event: SelectChangeEvent) => {
    set_sendMode(event.target.value as "path" | "numberOfHops" | "automaticPath" | "directMessage");
  }

  const handlePath = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_sendMode('path');
    set_path(event.target.value);
  };

  const handleNumberOfHops = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_numberOfHops(
      parseInt(event.target.value) || parseInt(event.target.value) === 0 ? parseInt(event.target.value) : 0,
    );
  };

  const handleOpenModal = () => {
    set_openModal(true);
  };

  const handleCloseModal = () => {
    set_sendMode('directMessage');
    set_numberOfHops(0);
    set_message('');
    set_selectedReceiver(null);
    set_path('');
    set_openModal(false);
    set_status('');
  };

  const handlePathKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault(); // Prevent space key from inserting a space
      const input = e.target as HTMLInputElement;
      // These are always a number... never null
      const start = input.selectionStart!;
      const end = input.selectionEnd!;
      set_path((prevPath) => prevPath.substring(0, start) + '\n' + prevPath.substring(end));
      setTimeout(() => {
        input.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
    else if (e.key === ',') {
      e.preventDefault(); // Prevent space key from inserting a space
      const input = e.target as HTMLInputElement;
      const start = input.selectionStart!;
      const end = input.selectionEnd!;
      set_path((prevPath) => prevPath.substring(0, start) + ',\n' + prevPath.substring(end));
      setTimeout(() => {
        input.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
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

  const hasAlias = (peerId: string) => {
    if (aliases) {
      return Object.values(aliases).includes(peerId)
    }
  }

  const findAlias = (peerId: string) => {
    if (aliases) {
      for (const alias in aliases) {
        if (aliases[alias] === peerId) {
          return alias;
        }
      }
    }
    return null;
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
        disabled={props.disabled}
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
          <Autocomplete
            value={selectedReceiver}
            onChange={(event, newValue) => {
              set_selectedReceiver(newValue);
            }}
            options={peersAndOwnNode}
            getOptionLabel={(peer) =>
              hasAlias(peer.peerId)
                ? `${findAlias(peer.peerId)} (${peer.peerId})`
                : peer.peerId
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Receiver"
                placeholder="Select Receiver"
                fullWidth
              />
            )}
          />

          <TextField
            label="Message"
            placeholder="Hello Node..."
            multiline
            rows={4}
            value={message}
            onChange={(e) => set_message(e.target.value)}
            inputProps={{ maxLength: maxLength }}
            helperText={`${remainingChars} characters remaining`}
            required
            fullWidth
          />
          <span style={{ margin: '0px 0px -2px' }}>Send mode:</span>
          <PathOrHops className={sendMode === "numberOfHops" ? "numerOfHopsSelected" : "noNumberOfHopsSelected"}>
            <Select
              value={sendMode}
              onChange={handleSendModeChange}
              className={sendMode === "numberOfHops" ? "numerOfHops" : "noNumberOfHops"}
            >
              <MenuItem value="directMessage">Direct Message</MenuItem>
              <MenuItem value='automaticPath'>Automatic Path</MenuItem>
              <MenuItem value='numberOfHops'>Number of Hops</MenuItem>
              <MenuItem value="path">Path</MenuItem>
            </Select>
            {sendMode === 'numberOfHops' && (
              <TextField
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
                style={{ flex: 1 }}
                fullWidth
              />
            )}
          </PathOrHops>
          {sendMode === 'path' && (
            <TextField
              label="Path"
              placeholder={"12D3Ko...Z3rz5F,\n12D3Ko...wxd4zv,\n12D3Ko...zF8c7u"}
              value={path}
              onChange={handlePath}
              onKeyDown={handlePathKeyDown}
              multiline
              rows={4}
              fullWidth
            />
          )}
        </SDialogContent>
        <DialogActions>
          <Button
            onClick={handleSendMessage}
            disabled={
              selectedReceiver === null || sendMode !== 'directMessage' && (sendMode !== 'automaticPath' && numberOfHops < 0 && path === '') || message.length === 0
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
      </SDialog >
    </>
  );
};
