import { useState, useEffect } from 'react';
import styled from '@emotion/styled';

// HOPRd SDK
import { SendMessagePayloadType } from '@hoprnet/hopr-sdk';
import { utils as hoprdUtils } from '@hoprnet/hopr-sdk';
import type { GetPeersResponseType, GetAliasesResponseType, OpenSessionPayloadType } from '@hoprnet/hopr-sdk';
const { sdkApiError } = hoprdUtils;

// HOPR Components
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import Button from '../../../future-hopr-lib-components/Button';
import PeersInfo from '../../../future-hopr-lib-components/PeerInfo';

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
  Tooltip,
  IconButton as IconButtonMui
} from '@mui/material';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import AddIcCallIcon from '@mui/icons-material/AddIcCall';

// Store
import { useAppDispatch, useAppSelector } from '../../../store';
import { actionsAsync } from '../../../store/slices/node/actionsAsync';
import type { AddressesType } from '../../../store/slices/node/initialState';

const PathOrHops = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  width: 100%;

  .numerOfHopsSelected {
    justify-content: center;
  }

  .noNumberOfHopsSelected {
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
  position: absolute;
  height: calc(100% - 32px);
  width: calc(100% - 32px);
  height: 100%;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  z-index: 100;
`;

type SendMessageModalProps = {
  peerId?: string;
  disabled?: boolean;
  tooltip?: JSX.Element | string;
};

const SFormGroup = styled(FormGroup)`
  flex-direction: row;
`

const PathNode = styled.div`
  width: 100%;
  display: flex;
  gap: 8px;
  .MuiAutocomplete-root {
    flex-grow: 1;
  }
  > .MuiButtonBase-root {
    width: 55px;
  }
`
const Splitscreen = styled.div`
  width: 100%;
  display: flex;
  gap: 8px;
  flex-direction: row;
  justify-content: space-between;
`

// order of peers: me, aliases (sorted by aliases), peers (sorted by peersIds)
function sortAddresses(
  peers: GetPeersResponseType | null,
  me: AddressesType,
  peerIdToAliasLink: {
    [peerId: string]: string;
  },
): string[] {
  if (!peers || !me) return [];
  const connectedPeers = peers.connected;
  const myAddress = me.hopr as string;
  const peerIdsWithAliases = Object.keys(peerIdToAliasLink).sort((a, b) =>
    peerIdToAliasLink[a] < peerIdToAliasLink[b] ? -1 : 1,
  );
  if (peerIdsWithAliases.length === 0) return [myAddress, ...connectedPeers.map((peer) => peer.peerId).sort()];
  const peerIdsWithAliasesWithoutMyAddress = peerIdsWithAliases.filter((peerId) => peerId !== myAddress);
  const connectedPeersWithoutAliases = connectedPeers
    .filter((peer) => !peerIdToAliasLink[peer.peerId])
    .map((peer) => peer.peerId)
    .sort();
  return [myAddress, ...peerIdsWithAliasesWithoutMyAddress, ...connectedPeersWithoutAliases];
}

export const OpenSessionModal = (props: SendMessageModalProps) => {
  const dispatch = useAppDispatch();

  const [loader, set_loader] = useState<boolean>(false);
  const [error, set_error] = useState<string | null>(null);
  const [numberOfHops, set_numberOfHops] = useState<number>(0);
  const [sendMode, set_sendMode] = useState<'path' | 'numberOfHops' >(
    'numberOfHops',
  );
  const [protocol, set_protocol] = useState<'udp' | 'tcp' >(
    'udp',
  );
  const [retransmission, set_retransmission] = useState<boolean>(true);
  const [segmentation, set_segmentation] = useState<boolean>(true);
  const [openModal, set_openModal] = useState<boolean>(false);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const aliases = useAppSelector((store) => store.node.aliases.data);
  const peerIdToAliasLink = useAppSelector((store) => store.node.links.peerIdToAlias);
  const peers = useAppSelector((store) => store.node.peers.data);
  const addresses = useAppSelector((store) => store.node.addresses.data);
  const sendMessageAddressBook = sortAddresses(peers, addresses, peerIdToAliasLink);
  const [destination, set_destination] = useState<string | null>(props.peerId ? props.peerId : null);
  const [listenHost, set_listenHost] = useState<string>('');
  const [sessionTarget, set_sessionTarget] = useState<string>('');
  const [intermediatePath, set_intermediatePath] = useState<(string|null)[]>([null]);
  const fullPath = [...intermediatePath, destination];


  // Errors
  const destinationMissing = !destination || (!!destination && destination.length === 0);
  const listenHostMissing = listenHost.length === 0;
  const sessionTargetMissing = sessionTarget.length === 0;
  const intermediatePathError = fullPath.findIndex(
    (elem, index)=>{
      return elem === fullPath[index+1]
    }
  ) !== -1;
  const intermediatePathEmptyLink = !(sendMode === 'path' && !intermediatePath.includes(null));

  const canOpenSession = (
    !destinationMissing &&
    !listenHostMissing &&
    !sessionTargetMissing &&
    (
      (
        sendMode === 'path' &&
        !intermediatePathError &&
        !intermediatePathEmptyLink  &&
        intermediatePath.length > 0
      )
      ||
      sendMode === 'numberOfHops'
    )
  );

  const setPropPeerId = () => {
    if (props.peerId) set_destination(props.peerId);
  };
  useEffect(setPropPeerId, [props.peerId]);

  useEffect(()=>{
    console.log('intermediatePathError', intermediatePathError)
  }, [intermediatePathError]);

  useEffect(() => {
    window.addEventListener('keydown', handleEnter as EventListener);
    return () => {
      window.removeEventListener('keydown', handleEnter as EventListener);
    };
  }, [loginData, destination, sendMode]);

  useEffect(() => {
    switch (sendMode) {
      case 'path':
        set_numberOfHops(0);
        break;
      case 'numberOfHops':
        break;
    }
  }, [sendMode]);

  const handleOpenSession = () => {
    if (!loginData.apiEndpoint || !destination) return;
    set_error(null);
    set_loader(true);
    //const validatedReceiver = validatePeerId(destination);

    const sessionPayload: OpenSessionPayloadType = {
      apiToken: loginData.apiToken ? loginData.apiToken : '',
      apiEndpoint: loginData.apiEndpoint,
      destination,
      listenHost,
      target: {
        Plain: sessionTarget,
      },
      capabilities: [],
      protocol,
      path: {},
    };

    if (sendMode === 'numberOfHops') {
      sessionPayload.path = {
        Hops: numberOfHops,
      }
    }
    if (sendMode == 'path' && intermediatePath.length > 0 && !intermediatePath.includes(null)) {
      sessionPayload.path = {
        IntermediatePath: intermediatePath as string[],
      };
    }
    if (retransmission) {
      sessionPayload.capabilities.push('Retransmission');
    }
    if (segmentation) {
      sessionPayload.capabilities.push('Segmentation');
    }

    dispatch(actionsAsync.openSessionThunk(sessionPayload))
      .unwrap()
      .then((res) => {
        console.log('@session: ', res);
        handleCloseModal();
      })
      .catch((e) => {
        console.log('@session err:', e);
        let errMsg = `Opening session failed`;
        if (e instanceof sdkApiError && e.hoprdErrorPayload?.status)
          errMsg = errMsg + `.\n${e.hoprdErrorPayload.status}`;
        if (e instanceof sdkApiError && e.hoprdErrorPayload?.error) errMsg = errMsg + `.\n${e.hoprdErrorPayload.error}`;
        set_error(errMsg);
      })
      .finally(() => {
        set_loader(false);
        if (loginData.apiEndpoint){
          dispatch(actionsAsync.getSessionsThunk({ apiToken: loginData.apiToken ? loginData.apiToken : '', apiEndpoint: loginData.apiEndpoint }));
        }
      });
  };

  const handleSendModeChange = (event: SelectChangeEvent) => {
    set_sendMode(event.target.value as 'path' | 'numberOfHops');
  };

  const handleNumberOfHops = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_numberOfHops(
      parseInt(event.target.value) || parseInt(event.target.value) === 0 ? parseInt(event.target.value) : 0,
    );
  };

  const handleOpenModal = () => {
    (document.activeElement as HTMLInputElement).blur();
    set_openModal(true);
  };

  const handleCloseModal = () => {
    set_sendMode('numberOfHops');
    set_numberOfHops(0);
    set_destination(props.peerId ? props.peerId : null);
    set_openModal(false);
    set_error(null);
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

  function handleEnter(event: KeyboardEvent) {
    if (canOpenSession && (event as KeyboardEvent)?.key === 'Enter') {
      console.log('OpenSessionModal event');
      handleOpenSession();
    }
  }

  return (
    <>
      <IconButton
        iconComponent={<AddIcCallIcon />}
        tooltipText={
          props.tooltip ? (
            props.tooltip
          ) : (
            <span>
              OPEN
              <br />
              session
            </span>
          )
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
          <DialogTitle>Open session</DialogTitle>
          <SIconButton
            aria-label="close modal"
            onClick={handleCloseModal}
          >
            <CloseIcon />
          </SIconButton>
        </TopBar>
        <SDialogContent>
          <Autocomplete
            value={destination}
            onChange={(event, newValue) => {
              set_destination(newValue);
            }}
            options={sendMessageAddressBook}
            getOptionLabel={(peerId) =>
              peerIdToAliasLink[peerId] ? `${peerIdToAliasLink[peerId]} (${peerId})` : peerId
            }
            autoSelect
            renderInput={(params) => (
              <TextField
                {...params}
                label="Destination"
                placeholder="Select Destination"
                fullWidth
              />
            )}
          // renderOption={(option)=>{
          //   return (
          //     <span>
          //       {JSON.stringify(option)}
          //     </span>
          //   )
          // }}
          />
          <TextField
            label="Listen host"
            placeholder={'127.0.0.1:10000'}
            value={listenHost}
            onChange={(event) => { set_listenHost(event?.target?.value) }}
            fullWidth
          />
          <TextField
            label="Session Target"
            placeholder={'127.0.0.1:8080'}
            value={sessionTarget}
            onChange={(event) => { set_sessionTarget(event?.target?.value) }}
            fullWidth
          />
          <Splitscreen>
            <div>
              <span style={{ margin: '0px 0px -2px' }}>Capabilities:</span>
              <SFormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={retransmission}
                    />
                  }
                  label="Retransmission"
                  onChange={() => {
                    set_retransmission(retransmission=> {return !retransmission})
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={segmentation}
                    />
                  }
                  label="Segmentation"
                  onChange={() => {
                    set_segmentation(segmentation => {return !segmentation})
                  }}
                />
              </SFormGroup>
            </div>
            <div>
              <span style={{ margin: '0px 0px -2px' }}>Protocol:</span>
              <SFormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={protocol === "udp"}
                    />
                  }
                  label="UDP"
                  onChange={() => {
                    set_protocol("udp")
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={protocol === "tcp"}
                    />
                  }
                  label="TCP"
                  onChange={() => {
                    set_protocol("tcp")
                  }}
                />
              </SFormGroup>
            </div>
          </Splitscreen>
          <span style={{ margin: '0px 0px -2px' }}>Path:</span>
          <PathOrHops className={sendMode === 'numberOfHops' ? 'numerOfHopsSelected' : 'noNumberOfHopsSelected'}>
            <Select
              value={sendMode}
              onChange={handleSendModeChange}
              className={sendMode === 'numberOfHops' ? 'numerOfHops' : 'noNumberOfHops'}
            >
              <MenuItem value="numberOfHops">Number of Hops</MenuItem>
              <MenuItem value="path">Intermediate Path</MenuItem>
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
            <>
              {
                intermediatePath.map((pathNode, pathIndex) =>
                  <PathNode
                    key={`path-node-${pathIndex}`}
                  >
                    <Autocomplete
                    //  key={`path-node-${pathIndex}-Autocomplete`}
                      value={pathNode}
                      onChange={(event, newValue) => {
                        set_intermediatePath(path => {
                          let tmp = [...path];
                          tmp[pathIndex] = newValue;
                          return tmp;
                        })
                      }}
                      options={sendMessageAddressBook}
                      getOptionLabel={(peerId) =>
                        peerIdToAliasLink[peerId] ? `${peerIdToAliasLink[peerId]} (${peerId})` : peerId
                      }
                      autoSelect
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Path node"
                          placeholder="Select node"
                          fullWidth
                        />
                      )}
                    />
                    <IconButtonMui
                      aria-label="delete node from path"
                      onClick={() => {
                        set_intermediatePath(path => { return path.filter((elem, index) => index !== pathIndex) })
                      }}
                    >
                      <DeleteIcon />
                    </IconButtonMui>
                  </PathNode>

                )
              }
              <Button
                outlined
                onClick={() => { set_intermediatePath(path => { return [...path, null] }) }}
                style={{
                  marginTop: '8px',
                  width: '258px',
                  margin: 'auto',
                }}
                startIcon={<AddCircleIcon />}
                disabled={intermediatePath.length > 10}
              >
                Add a node to path
              </Button>
            </>
          )}
        </SDialogContent>
        <DialogActions>
          <Button
            onClick={handleOpenSession}
            pending={loader}
            disabled={!canOpenSession}
            style={{
              width: '100%',
              marginTop: '8px',
              marginBottom: '8px',
            }}
          >
            Open
          </Button>
        </DialogActions>

        {error && (
          <StatusContainer>
            <TopBar>
              <DialogTitle>ERROR</DialogTitle>
              <SIconButton
                aria-label="hide error"
                onClick={() => {
                  set_error(null);
                }}
              >
                <CloseIcon />
              </SIconButton>
            </TopBar>
            <SDialogContent className="error-message">{error}</SDialogContent>
          </StatusContainer>
        )}
      </SDialog>
    </>
  );
};
