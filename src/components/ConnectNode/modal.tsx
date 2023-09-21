import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import styled from '@emotion/styled';
import { trackGoal } from 'fathom-client';

// Stores
import { authActions, authActionsAsync } from '../../store/slices/auth';
import { nodeActionsAsync, nodeActions } from '../../store/slices/node';
import { appActions } from '../../store/slices/app';

// HOPR Components
import Select from '../../future-hopr-lib-components/Select';
import Checkbox from '../../future-hopr-lib-components/Toggles/Checkbox';
import Modal from '../../future-hopr-lib-components/Modal';
import TextField from '../../future-hopr-lib-components/TextField';
import Button from '../../future-hopr-lib-components/Button';
import StyledGrayButton from '../../future-hopr-lib-components/Button/gray';

// MUI
import { Tooltip, IconButton } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

type ParsedNode = {
  name: string;
  localName: string;
  value: string;
  apiEndpoint: string;
  apiToken: string;
};

type ConnectNodeModalProps = {
  open: boolean;
  handleClose: () => void;
};

const SModal = styled(Modal)`
  position: relative;
`;

const LocalNodesContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 48px;
  button {
    height: 48px;
    width: 48px;
  }
`;

const SaveTokenContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 24px;
  width: 100%;
  justify-content: center;
`;

const ConnectContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  justify-content: center;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  z-index: 100;
  &.overlay-has-error {
    align-items: flex-start;
    background: rgba(255, 255, 255, 1);
    p {
      margin-top: 24px;
      font-weight: 600;
    }
    .error {
      width: calc(100% - 32px);
      word-wrap: break-word;
      padding-bottom: 16px;
      white-space: pre-wrap;
    }
  }
`;

const ButtonGroupContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  button {
    margin-top: 16px;
    padding-inline: 2rem;
  }
`;

const ForceLoginButton = styled(Button)`
  &.btn-hopr--v2:not(.Mui-disabled) {
    background: #f67f2f;
    color: #fff;
  }

  text-transform: uppercase;
`;

const CloseOverlayIconButton = styled(IconButton)`
  position: absolute;
  right: 16px;
  top: 16px;
`;

const loginAnywaysWarning = "Your node did not start properly and might not be fully functioning. Some features might be offline and not working";
const defaultProps = { open: false };

function ConnectNodeModal(props: ConnectNodeModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const nodesSavedLocally = useAppSelector((store) => store.auth.nodes);
  const [nodesSavedLocallyParsed, set_nodesSavedLocallyParsed] = useState([] as ParsedNode[]);
  const errorMessage = useAppSelector((store) => store.auth.status.error?.data);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const [searchParams, set_searchParams] = useSearchParams();
  const [localName, set_localName] = useState(loginData.localName ? loginData.localName : '');
  const [apiEndpoint, set_apiEndpoint] = useState(loginData.apiEndpoint ? loginData.apiEndpoint : '');
  const [apiToken, set_apiToken] = useState(loginData.apiToken ? loginData.apiToken : '');
  const [saveApiToken, set_saveApiToken] = useState(false);
  const [areYouSureYouWannaDeleteAllSavedNodes, set_areYouSureYouWannaDeleteAllSavedNodes] = useState(false);
  const [nodesSavedLocallyChosenIndex, set_nodesSavedLocallyChosenIndex] = useState('' as string);
  const [forceLogin, set_forceLogin] = useState(false);
  const [apiEndpointError, set_apiEndpointError] = useState<string | null>(null);

  useEffect(() => {
    const parsed = nodesSavedLocally.map((node, index) => {
      return {
        name: node.localName ? `${node.localName} (${node.apiEndpoint})` : node.apiEndpoint,
        localName: node.localName,
        value: index.toString(),
        apiEndpoint: node.apiEndpoint,
        apiToken: node.apiToken,
      };
    }) as ParsedNode[];
    set_nodesSavedLocallyParsed(parsed);
  }, [nodesSavedLocally]);

  useEffect(() => {
    // Update the Select based on loginData from the Store
    if (!loginData.apiEndpoint) return;
    const existingItemIndex = nodesSavedLocally.findIndex((item: any) => item.apiEndpoint === loginData.apiEndpoint);
    if (existingItemIndex !== -1) set_nodesSavedLocallyChosenIndex(existingItemIndex.toString());
    const existingItem = nodesSavedLocally[existingItemIndex] as ParsedNode;
    if (existingItem && existingItem.apiToken.length > 0 && loginData.apiToken === existingItem.apiToken)
      set_saveApiToken(true);
  }, [loginData]);

  useEffect(() => {
    // Update the TextFields based on loginData from the Store
    if (loginData.apiEndpoint === apiEndpoint && loginData.apiToken === apiToken) return;
    const apiEndpointSP = searchParams.get('apiEndpoint');
    const apiTokenSP = searchParams.get('apiToken');
    if (!apiEndpointSP && !apiTokenSP) return;

    if (loginData.localName) {
      set_localName(loginData.localName);
    }
    if (loginData.apiEndpoint) {
      set_apiEndpoint(loginData.apiEndpoint);
    }
    if (loginData.apiToken) {
      set_apiToken(loginData.apiToken);
    }

    // If have have saved the node with the same apiToken, we check the saveApiToken checkbox
    const existingItemIndex = nodesSavedLocally.findIndex(
      (item) => item.apiEndpoint === loginData.apiEndpoint && item.apiToken === loginData.apiToken,
    );

    if (
      existingItemIndex !== -1 &&
      nodesSavedLocally[existingItemIndex].apiToken &&
      (nodesSavedLocally[existingItemIndex].apiToken?.length ?? 0) > 0
    ) {
      set_saveApiToken(true);
    }
  }, [loginData]);

  useEffect(() => {
    if (errorMessage) navigate(`/?apiToken=${apiToken}&apiEndpoint=${apiEndpoint}`);
  }, [errorMessage]);

  const parseAndFormatUrl = (url: string) => {

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    const parts = url.split('/');
    let hostAndPort = parts[2]; // Get the part that contains the host and port

    if (hostAndPort.indexOf(':') === -1) {
      hostAndPort += ':3001';
    }

    parts[2] = hostAndPort;
    try {
      new URL(parts.join('/'));
      set_apiEndpointError(null)
      return parts.join('/');
    } catch (e) {
      set_apiEndpointError('API Endpoint was incorrectly formatted')
      return null;
    }
  };

  const saveNode = () => {
    const formattedApiEndpoint = parseAndFormatUrl(apiEndpoint);
    if (!formattedApiEndpoint) {
      return;
    }
    dispatch(
      authActions.addNodeData({
        apiEndpoint: formattedApiEndpoint,
        apiToken: saveApiToken ? apiToken : '',
        localName: localName ? localName : '',
      }),
    );
  };

  const useNode = async ({ force }: { force?: boolean }) => {
    const formattedApiEndpoint = parseAndFormatUrl(apiEndpoint);
    if (!formattedApiEndpoint) {
      return;
    }
    set_searchParams({
      apiToken,
      formattedApiEndpoint,
    });
    dispatch(authActions.resetState());
    dispatch(nodeActions.resetState());
    dispatch(appActions.resetNodeState());
    dispatch(nodeActions.closeMessagesWebsocket());
    try {
      const loginInfo = await dispatch(
        authActionsAsync.loginThunk({
          apiEndpoint: formattedApiEndpoint,
          apiToken,
          force,
        }),
      ).unwrap();
      if (loginInfo) {
        dispatch(
          authActions.useNodeData({
            apiEndpoint: formattedApiEndpoint,
            apiToken,
            localName,
          }),
        );
        dispatch(
          nodeActionsAsync.getAddressesThunk({
            apiToken,
            apiEndpoint: formattedApiEndpoint,
          }),
        );
        dispatch(
          nodeActionsAsync.getAliasesThunk({
            apiToken,
            apiEndpoint: formattedApiEndpoint,
          }),
        );
        dispatch(nodeActions.setInfo(loginInfo));
        dispatch(nodeActions.initializeMessagesWebsocket());
        navigate(`/node/info?apiToken=${apiToken}&apiEndpoint=${formattedApiEndpoint}`);
        trackGoal('IZUWDE9K', 1);
        props.handleClose();
      }
    } catch (e) {
      // error is handled in redux
      trackGoal('WWH3JCEH', 1);
    } finally {
      set_forceLogin(false);
    }
  };

  const handleClose = () => {
    props.handleClose();
    if (errorMessage) {
      setTimeout(() => {
        dispatch(authActions.resetState());
      }, 200);
    }
  };

  const clearSingleLocal = (index: number) => {
    dispatch(authActions.clearLocalNode(index));
  };

  const clearLocalNodes = () => {
    set_nodesSavedLocallyChosenIndex('');
    dispatch(authActions.clearLocalNodes());
  };

  const handleSelectlocalNodes = (event: SelectChangeEvent<unknown>) => {
    const index = event.target.value as string;
    const chosenNode = nodesSavedLocally[parseInt(index)] as ParsedNode;
    set_nodesSavedLocallyChosenIndex(index);
    set_apiEndpoint(chosenNode.apiEndpoint);
    set_apiToken(chosenNode.apiToken);
    set_saveApiToken(chosenNode.apiToken?.length > 0);
    set_localName(chosenNode.localName);
  };

  return (
    <>
      <SModal
        open={props.open}
        onClose={handleClose}
        title="CONNECT NODE"
        maxWidth={'580px'}
        disableScrollLock={true}
      >
        <LocalNodesContainer>
          <Select
            label={'Nodes saved in browser local storage'}
            values={nodesSavedLocallyParsed}
            disabled={nodesSavedLocally.length === 0}
            value={nodesSavedLocallyChosenIndex}
            onChange={handleSelectlocalNodes}
            style={{ width: '100%' }}
            removeValue={clearSingleLocal}
            removeValueTooltip={'Remove node from local storage'}
          />
          <Tooltip title={'Clear all node credentials from the browser local storage'}>
            <span>
              <IconButton
                aria-label="delete"
                disabled={nodesSavedLocally.length === 0}
                onClick={() => {
                  set_areYouSureYouWannaDeleteAllSavedNodes(true);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </LocalNodesContainer>

        <p>
          <strong>Node credentials:</strong>
        </p>
        <TextField
          label={'Local name (optional)'}
          value={localName}
          onChange={(event) => {
            set_localName(event.target.value);
          }}
          style={{ width: '100%' }}
        />
        <TextField
          label={'API endpoint (required)'}
          value={apiEndpoint}
          onChange={(event) => {
            set_apiEndpoint(event.target.value);
          }}
          error={apiEndpointError !== null}
          helperText={apiEndpointError}
          style={{ width: '100%' }}
        />
        <TextField
          label={'API token (required)'}
          value={apiToken}
          onChange={(event) => {
            set_apiToken(event.target.value);
          }}
          style={{ width: '100%' }}
        />
        <SaveTokenContainer>
          <Checkbox
            label={'Save API token locally (unsafe)'}
            value={saveApiToken}
            onChange={(event) => {
              set_saveApiToken(event.target.checked);
            }}
          />
          <Tooltip title={'Save node credentials in browser local storage'}>
            <Button
              onClick={saveNode}
              disabled={apiEndpoint.length === 0}
            >
              Save
            </Button>
          </Tooltip>
        </SaveTokenContainer>

        <ConnectContainer>
          <Button
            onClick={() => useNode({})}
            disabled={apiEndpoint.length === 0 || apiToken.length === 0}
          >
            Connect to the node
          </Button>
        </ConnectContainer>

        {errorMessage && !forceLogin && (
          <Overlay className={'overlay-has-error'}>
            <CloseOverlayIconButton
              color="primary"
              aria-label="close modal"
              onClick={() => {
                dispatch(authActions.resetState());
              }}
            >
              <CloseIcon />
            </CloseOverlayIconButton>
            <div className={'error'}>
              <div>
                <p>ERROR</p>
                {errorMessage}
              </div>

              {errorMessage !== 'UNAUTHORIZED' &&
                <div style={{
                  textAlign: 'center', marginTop: '32px',
                }}>
                  <Tooltip title={loginAnywaysWarning}>
                    <ForceLoginButton
                      onClick={() => set_forceLogin(true)}
                      disabled={apiEndpoint.length === 0 || apiToken.length === 0}
                    >
                      Login anyways
                    </ForceLoginButton>
                  </Tooltip>
                </div>}
            </div>
          </Overlay>
        )}

      </SModal>

      <Modal
        open={areYouSureYouWannaDeleteAllSavedNodes}
        onClose={() => {
          set_areYouSureYouWannaDeleteAllSavedNodes(false);
        }}
        disableScrollLock={true}
        title="Are you sure that you wanna remove all saved nodes?"
      >
        <br />
        <ConnectContainer>
          <StyledGrayButton
            onClick={() => {
              set_areYouSureYouWannaDeleteAllSavedNodes(false);
            }}
          >
            No
          </StyledGrayButton>
          <Button onClick={clearLocalNodes}>Remove all</Button>
        </ConnectContainer>
      </Modal>

      <Modal
        open={forceLogin}
        onClose={() => {
          set_forceLogin(false);
        }}
        disableScrollLock={true}
        title="WARNING"
      >
        <p>{loginAnywaysWarning}</p>
        <ButtonGroupContainer>
          <Button outlined onClick={() => set_forceLogin(false)}>BACK</Button>
          <ForceLoginButton
            onClick={() => {
              set_forceLogin(false);
              useNode({ force: true });
            }}
            disabled={apiEndpoint.length === 0 || apiToken.length === 0}
          >
            Login anyways
          </ForceLoginButton>
        </ButtonGroupContainer>
      </Modal>
    </>
  );
}

ConnectNodeModal.defaultProps = defaultProps;
export default ConnectNodeModal;
