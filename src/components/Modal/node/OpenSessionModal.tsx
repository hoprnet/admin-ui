import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { sendNotification } from '../../../hooks/useWatcher/notifications';

// HOPRd SDK
import { utils as hoprdUtils } from '@hoprnet/hopr-sdk';
import type { GetPeersResponseType, OpenSessionPayloadType } from '@hoprnet/hopr-sdk';
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
  IconButton as IconButtonMui,
  InputAdornment,
  Radio,
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

type OpenSessionModalProps = {
  destination?: string;
  disabled?: boolean;
  tooltip?: JSX.Element | string;
};

const SFormGroup = styled(FormGroup)`
  flex-direction: row;
`;

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
`;
const Splitscreen = styled.div`
  width: 100%;
  display: flex;
  gap: 8px;
  flex-direction: row;
  justify-content: space-between;
`;

export const OpenSessionModal = (props: OpenSessionModalProps) => {
  const dispatch = useAppDispatch();

  const [loader, set_loader] = useState<boolean>(false);
  const [error, set_error] = useState<string | null>(null);
  const [numberOfForwardHops, set_numberOfForwardHops] = useState<number>(0);
  const [numberOfReturnHops, set_numberOfReturnHops] = useState<number>(0);
  const [sendForwardMode, set_sendForwardMode] = useState<'path' | 'numberOfHops'>('numberOfHops');
  const [sendReturnMode, set_sendReturnMode] = useState<'path' | 'numberOfHops'>('numberOfHops');
  const [protocol, set_protocol] = useState<'udp' | 'tcp'>('udp');
  const [responseBuffer, set_responseBuffer] = useState<number>(2048);
  const [retransmission, set_retransmission] = useState<boolean>(true);
  const [segmentation, set_segmentation] = useState<boolean>(true);
  const [openModal, set_openModal] = useState<boolean>(false);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const aliases = useAppSelector((store) => store.node.aliases);

  const [destination, set_destination] = useState<string | null>(props.destination ? props.destination : null);
  const [listenHost, set_listenHost] = useState<string>('');
  const [sessionTarget, set_sessionTarget] = useState<string>('');
  const [intermediateForwardPath, set_intermediateForwardPath] = useState<(string | null)[]>([null]);
  const [intermediateReturnPath, set_intermediateReturnPath] = useState<(string | null)[]>([null]);
  const fullForwardPath = [...intermediateForwardPath, destination];
  const fullReturnPath = [...intermediateReturnPath, destination];

  const myAddress = useAppSelector((store) => store.node.addresses.data.native || '');
  const sortedAliases = useAppSelector((store) => store.node.links.sortedAliases);
  const aliasToNodeAddress = useAppSelector((store) => store.node.links.aliasToNodeAddress);
  const sortedConnectedPeers = useAppSelector((store) => store.node.peers.parsed.connectedSorted);
  const nodeAddressesWithAliases = useAppSelector((store) => store.node.links.nodeAddressesWithAliases);
  const addressBook = [
    myAddress,
    ...sortedAliases.map((alias) => aliasToNodeAddress[alias]),
    ...sortedConnectedPeers.filter(nodeAddress => nodeAddress !== myAddress && !nodeAddressesWithAliases.includes(nodeAddress))
  ];

  // Errors
  const destinationMissing = !destination || (!!destination && destination.length === 0);
  const listenHostMissing = listenHost.length === 0;
  const sessionTargetMissing = sessionTarget.length === 0;

  //Fordward path errors
  const intermediateForwardPathError =
    fullForwardPath.findIndex((elem, index) => {
      return elem === fullForwardPath[index + 1];
    }) !== -1;
  const intermediateForwardPathEmptyLink = !(sendForwardMode === 'path' && !intermediateForwardPath.includes(null));

  //Return path errors
  const intermediateReturnPathError =
    fullReturnPath.findIndex((elem, index) => {
      return elem === fullReturnPath[index + 1];
    }) !== -1;
  const intermediateReturnPathEmptyLink = !(sendReturnMode === 'path' && !intermediateReturnPath.includes(null));

  const canOpenSession =
    !destinationMissing &&
    !listenHostMissing &&
    !sessionTargetMissing &&
    ((sendForwardMode === 'path' &&
      !intermediateForwardPathError &&
      !intermediateForwardPathEmptyLink &&
      intermediateForwardPath.length > 0) ||
      sendForwardMode === 'numberOfHops') &&
    ((sendReturnMode === 'path' &&
      !intermediateReturnPathError &&
      !intermediateReturnPathEmptyLink &&
      intermediateReturnPath.length > 0) ||
      sendReturnMode === 'numberOfHops');

  const setPropPeerId = () => {
    if (props.destination) set_destination(props.destination);
  };
  useEffect(setPropPeerId, [props.destination]);

  useEffect(() => {
    console.log('intermediateForwardPathError', intermediateForwardPathError);
  }, [intermediateForwardPathError]);

  useEffect(() => {
    console.log('intermediateReturnPathError', intermediateReturnPathError);
  }, [intermediateReturnPathError]);

  useEffect(() => {
    window.addEventListener('keydown', handleEnter as EventListener);
    return () => {
      window.removeEventListener('keydown', handleEnter as EventListener);
    };
  }, [loginData, destination, sendForwardMode, sendReturnMode]);

  useEffect(() => {
    switch (sendForwardMode) {
      case 'path':
        set_numberOfForwardHops(0);
        break;
      case 'numberOfHops':
        break;
    }
  }, [sendForwardMode]);

  useEffect(() => {
    switch (sendReturnMode) {
      case 'path':
        set_numberOfReturnHops(0);
        break;
      case 'numberOfHops':
        break;
    }
  }, [sendReturnMode]);

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
      forwardPath: {},
      returnPath: {},
      responseBuffer: `${responseBuffer} kB`,
    };

    if (sendForwardMode === 'numberOfHops') {
      sessionPayload.forwardPath = {
        Hops: numberOfForwardHops,
      };
    }
    if (sendForwardMode == 'path' && intermediateForwardPath.length > 0 && !intermediateForwardPath.includes(null)) {
      sessionPayload.forwardPath = {
        IntermediatePath: intermediateForwardPath as string[],
      };
    }
    if (sendReturnMode === 'numberOfHops') {
      sessionPayload.returnPath = {
        Hops: numberOfForwardHops,
      };
    }
    if (sendReturnMode == 'path' && intermediateReturnPath.length > 0 && !intermediateReturnPath.includes(null)) {
      sessionPayload.returnPath = {
        IntermediatePath: intermediateReturnPath as string[],
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
      .then(() => {
        const msg = `Session (${protocol}) to ${sessionTarget} is opened`;
        sendNotification({
          notificationPayload: {
            source: 'node',
            name: msg,
            url: null,
            timeout: null,
          },
          toastPayload: { message: msg },
          dispatch,
        });
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
        if (loginData.apiEndpoint) {
          dispatch(
            actionsAsync.getSessionsThunk({
              apiToken: loginData.apiToken ? loginData.apiToken : '',
              apiEndpoint: loginData.apiEndpoint,
            }),
          );
        }
      });
  };

  const handleSendForwardModeChange = (event: SelectChangeEvent) => {
    set_sendForwardMode(event.target.value as 'path' | 'numberOfHops');
  };

  const handleSendReturnModeChange = (event: SelectChangeEvent) => {
    set_sendReturnMode(event.target.value as 'path' | 'numberOfHops');
  };

  const handlenumberOfForwardHops = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_numberOfForwardHops(
      parseInt(event.target.value) || parseInt(event.target.value) === 0 ? parseInt(event.target.value) : 0,
    );
  };

  const handlenumberOfReturnHops = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_numberOfReturnHops(
      parseInt(event.target.value) || parseInt(event.target.value) === 0 ? parseInt(event.target.value) : 0,
    );
  };

  const handleOpenModal = () => {
    (document.activeElement as HTMLInputElement).blur();
    set_openModal(true);
  };

  const handleCloseModal = () => {
    set_sendForwardMode('numberOfHops');
    set_numberOfForwardHops(0);
    set_destination(props.destination ? props.destination : null);
    set_openModal(false);
    set_error(null);
  };

  const isAlias = (alias: string) => {
    // if (aliases) {
    //   return !!aliases[alias];
    // }
    return false;
  };

  const validatePeerId = (receiver: string) => {
    // if (aliases && isAlias(receiver)) {
    //   return aliases[receiver];
    // }
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
            options={addressBook}
            getOptionLabel={(address) => (aliases[address] ? `${aliases[address]} (${address})` : address)}
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
            onChange={(event) => {
              set_listenHost(event?.target?.value);
            }}
            fullWidth
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '8px',
            }}
          >
            <TextField
              label="Session Target"
              placeholder={'127.0.0.1:8080'}
              value={sessionTarget}
              onChange={(event) => {
                set_sessionTarget(event?.target?.value);
              }}
              fullWidth
            />
            <TextField
              label="Response buffer"
              value={responseBuffer}
              onChange={(event) => {
                set_responseBuffer(Number(event?.target?.value));
              }}
              inputProps={{
                type: 'number',
                min: 1,
                max: 10000,
                step: 1,
              }}
              InputProps={{
                endAdornment: <InputAdornment position="end">kB</InputAdornment>,
              }}
              style={{
                width: '170px',
              }}
            />
          </div>
          <Splitscreen>
            <div>
              <span style={{ margin: '0px 0px -2px' }}>Capabilities:</span>
              <SFormGroup>
                <FormControlLabel
                  control={<Checkbox checked={retransmission} />}
                  label="Retransmission"
                  onChange={() => {
                    set_retransmission((retransmission) => {
                      return !retransmission;
                    });
                  }}
                />
                <FormControlLabel
                  control={<Checkbox checked={segmentation} />}
                  label="Segmentation"
                  onChange={() => {
                    set_segmentation((segmentation) => {
                      return !segmentation;
                    });
                  }}
                />
              </SFormGroup>
            </div>
            <div>
              <span style={{ margin: '0px 0px -2px' }}>Protocol:</span>
              <SFormGroup>
                <FormControlLabel
                  control={<Radio checked={protocol === 'udp'} />}
                  label="UDP"
                  onChange={() => {
                    set_protocol('udp');
                  }}
                />
                <FormControlLabel
                  control={<Radio checked={protocol === 'tcp'} />}
                  label="TCP"
                  onChange={() => {
                    set_protocol('tcp');
                  }}
                />
              </SFormGroup>
            </div>
          </Splitscreen>

          <span style={{ margin: '0px 0px -2px' }}>Forward path:</span>
          <PathOrHops className={sendForwardMode === 'numberOfHops' ? 'numerOfHopsSelected' : 'noNumberOfHopsSelected'}>
            <Select
              value={sendForwardMode}
              onChange={handleSendForwardModeChange}
              className={sendForwardMode === 'numberOfHops' ? 'numerOfHops' : 'noNumberOfHops'}
            >
              <MenuItem value="numberOfHops">Number of hops</MenuItem>
              <MenuItem value="path">Intermediate Path</MenuItem>
            </Select>
            {sendForwardMode === 'numberOfHops' && (
              <TextField
                type="number"
                label="Number of forward hops"
                placeholder="1"
                value={numberOfForwardHops}
                onChange={handlenumberOfForwardHops}
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
          {sendForwardMode === 'path' && (
            <>
              {intermediateForwardPath.map((pathNode, pathIndex) => (
                <PathNode key={`path-node-${pathIndex}`}>
                  <Autocomplete
                    //  key={`path-node-${pathIndex}-Autocomplete`}
                    value={pathNode}
                    onChange={(event, newValue) => {
                      set_intermediateForwardPath((path) => {
                        const tmp = [...path];
                        tmp[pathIndex] = newValue;
                        return tmp;
                      });
                    }}
                    options={addressBook}
                    getOptionLabel={(address) => (aliases[address] ? `${aliases[address]} (${address})` : address)}
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
                      set_intermediateForwardPath((path) => {
                        return path.filter((elem, index) => index !== pathIndex);
                      });
                    }}
                  >
                    <DeleteIcon />
                  </IconButtonMui>
                </PathNode>
              ))}
              <Button
                outlined
                onClick={() => {
                  set_intermediateForwardPath((path) => {
                    return [...path, null];
                  });
                }}
                style={{
                  marginTop: '8px',
                  width: '258px',
                  margin: 'auto',
                }}
                startIcon={<AddCircleIcon />}
                disabled={intermediateForwardPath.length > 10}
              >
                Add a node to path
              </Button>
            </>
          )}

          <span style={{ margin: '0px 0px -2px' }}>Return path:</span>
          <PathOrHops className={sendReturnMode === 'numberOfHops' ? 'numerOfHopsSelected' : 'noNumberOfHopsSelected'}>
            <Select
              value={sendReturnMode}
              onChange={handleSendReturnModeChange}
              className={sendReturnMode === 'numberOfHops' ? 'numerOfHops' : 'noNumberOfHops'}
            >
              <MenuItem value="numberOfHops">Number of hops</MenuItem>
              <MenuItem value="path">Intermediate Path</MenuItem>
            </Select>
            {sendReturnMode === 'numberOfHops' && (
              <TextField
                type="number"
                label="Number of return hops"
                placeholder="1"
                value={numberOfReturnHops}
                onChange={handlenumberOfReturnHops}
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
          {sendReturnMode === 'path' && (
            <>
              {intermediateReturnPath.map((pathNode, pathIndex) => (
                <PathNode key={`path-node-${pathIndex}`}>
                  <Autocomplete
                    //  key={`path-node-${pathIndex}-Autocomplete`}
                    value={pathNode}
                    onChange={(event, newValue) => {
                      set_intermediateReturnPath((path) => {
                        const tmp = [...path];
                        tmp[pathIndex] = newValue;
                        return tmp;
                      });
                    }}
                    options={addressBook}
                    getOptionLabel={(address) => (aliases[address] ? `${aliases[address]} (${address})` : address)}
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
                      set_intermediateReturnPath((path) => {
                        return path.filter((elem, index) => index !== pathIndex);
                      });
                    }}
                  >
                    <DeleteIcon />
                  </IconButtonMui>
                </PathNode>
              ))}
              <Button
                outlined
                onClick={() => {
                  set_intermediateReturnPath((path) => {
                    return [...path, null];
                  });
                }}
                style={{
                  marginTop: '8px',
                  width: '258px',
                  margin: 'auto',
                }}
                startIcon={<AddCircleIcon />}
                disabled={intermediateReturnPath.length > 10}
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
