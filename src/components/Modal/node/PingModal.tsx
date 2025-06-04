import { useState, useEffect, KeyboardEvent } from 'react';
import { DialogTitle, TextField, DialogActions, Alert } from '@mui/material';
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import { useAppDispatch, useAppSelector } from '../../../store';
import { actionsAsync } from '../../../store/slices/node/actionsAsync';
import CloseIcon from '@mui/icons-material/Close';
import { sendNotification } from '../../../hooks/useWatcher/notifications';
import { utils as hoprdUlils, PingPeerPayloadType, PingPeerResponseType } from '@hoprnet/hopr-sdk';
const { sdkApiError } = hoprdUlils;

// HOPR Components
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import Button from '../../../future-hopr-lib-components/Button';

type PingModalProps = {
  address?: string;
  disabled?: boolean;
  tooltip?: JSX.Element | string;
};

export const PingModal = (props: PingModalProps) => {
  const dispatch = useAppDispatch();
  const loginData = useAppSelector((selector) => selector.auth.loginData);
  const aliases = useAppSelector((store) => store.node.aliases);
  const [address, set_address] = useState<string>(props.address ? props.address : '');
  const [openModal, set_OpenModal] = useState(false);
  const [disableButton, set_disableButton] = useState(false);
  const canPing = address.length !== 0;

  useEffect(() => {
    window.addEventListener('keydown', handleEnter as unknown as EventListener);
    return () => {
      window.removeEventListener('keydown', handleEnter as unknown as EventListener);
    };
  }, [loginData, address]);

  const getAliasByAddress = (address: string): string => {
    if (aliases && address && aliases[address]) return `${aliases[address]} (${address})`;
    return address;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_address(event.target.value);
  };

  const setPropAddress = () => {
    if (props.address) set_address(props.address);
  };
  useEffect(setPropAddress, [props.address]);

  const handleOpenModal = () => {
    (document.activeElement as HTMLInputElement).blur();
    set_OpenModal(true);
  };

  const handleCloseModal = () => {
    set_OpenModal(false);
    set_address('');
    setPropAddress();
  };

  const handlePing = () => {
    if (loginData.apiEndpoint) {
      set_disableButton(true);
      dispatch(
        actionsAsync.pingNodeThunk({
          address: address,
          apiEndpoint: loginData.apiEndpoint,
          apiToken: loginData.apiToken ? loginData.apiToken : '',
        }),
      )
        .unwrap()
        .then((resp: PingPeerResponseType) => {
          const msg = `Ping of ${getAliasByAddress(address)} succeeded with latency of ${resp.latency}ms`;
          console.log(msg, resp);
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
        .catch(async (e) => {
          const isCurrentApiEndpointTheSame = await dispatch(
            actionsAsync.isCurrentApiEndpointTheSame(loginData.apiEndpoint!),
          ).unwrap();
          if (!isCurrentApiEndpointTheSame) return;

          let errMsg = `Ping of ${getAliasByAddress(address)} failed`;
          if (e instanceof sdkApiError && e.hoprdErrorPayload?.status)
            errMsg = errMsg + `.\n${e.hoprdErrorPayload.status}`;
          if (e instanceof sdkApiError && e.hoprdErrorPayload?.error)
            errMsg = errMsg + `.\n${e.hoprdErrorPayload.error}`;
          console.warn(errMsg, e);
          sendNotification({
            notificationPayload: {
              source: 'node',
              name: errMsg,
              url: null,
              timeout: null,
            },
            toastPayload: { message: errMsg },
            dispatch,
          });
        })
        .finally(() => {
          handleCloseModal();
          set_disableButton(false);
        });
    }
  };

  const handleEnter = (event: KeyboardEvent) => {
    if (canPing && openModal && event?.key === 'Enter') {
      console.log('PingModal event');
      handlePing();
    }
  };

  return (
    <>
      <IconButton
        iconComponent={<RssFeedIcon />}
        tooltipText={
          props.tooltip ? (
            props.tooltip
          ) : (
            <span>
              PING
              <br />
              node
            </span>
          )
        }
        onClick={address ? handlePing : handleOpenModal}
        disabled={props.disabled}
        pending={disableButton}
      />
      <SDialog
        open={openModal}
        onClose={handleCloseModal}
        disableScrollLock={true}
      >
        <TopBar>
          <DialogTitle>Ping node</DialogTitle>
          <SIconButton
            aria-label="close modal"
            onClick={handleCloseModal}
          >
            <CloseIcon />
          </SIconButton>
        </TopBar>
        <SDialogContent>
          <TextField
            type="text"
            name="peerAddress"
            label="Node address"
            placeholder="0x154a...d6D9E7f3"
            onChange={handleChange}
            value={address}
            autoFocus
          />
        </SDialogContent>
        <DialogActions>
          <Button
            disabled={!canPing}
            pending={disableButton}
            onClick={handlePing}
            style={{
              marginRight: '16px',
              marginBottom: '6px',
              marginTop: '-6px',
            }}
          >
            Ping
          </Button>
        </DialogActions>
      </SDialog>
    </>
  );
};
