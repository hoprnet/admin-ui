import React, { useState, useEffect } from 'react';
import { DialogActions, DialogTitle, InputAdornment, TextField } from '@mui/material';
import { ethers } from 'ethers';
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import { useAppDispatch, useAppSelector } from '../../../store';
import { actionsAsync } from '../../../store/slices/node/actionsAsync';
import { sendNotification } from '../../../hooks/useWatcher/notifications';
import { HOPR_TOKEN_USED } from '../../../../config';
import { utils } from '@hoprnet/hopr-sdk';
const { sdkApiError } = utils;

// HOPR Components
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import AddChannelIcon from '../../../future-hopr-lib-components/Icons/AddChannel';
import Button from '../../../future-hopr-lib-components/Button';

// Mui
import CloseIcon from '@mui/icons-material/Close';
import { nodeActionsAsync } from '../../../store/slices/node';

type OpenChannelModalProps = {
  peerAddress?: string;
  disabled?: boolean;
  tooltip?: JSX.Element | string;
};

export const OpenChannelModal = ({ ...props }: OpenChannelModalProps) => {
  const dispatch = useAppDispatch();
  const loginData = useAppSelector((store) => store.auth.loginData);
  const outgoingOpening = useAppSelector((store) => store.node.channels.parsed.outgoingOpening);
  const aliases = useAppSelector((store) => store.node.aliases);
  const peerIdToAliasLink = useAppSelector((store) => store.node.links.peerIdToAlias);
  const channelIsBeingOpened = props.peerAddress ? !!outgoingOpening[props.peerAddress] : false;
  const [openChannelModal, set_openChannelModal] = useState(false);
  const [amount, set_amount] = useState('');
  const [peerAddress, set_peerAddress] = useState(props.peerAddress ? props.peerAddress : '');
  const canOpen = !(!amount || parseFloat(amount) <= 0 || !peerAddress);

  useEffect(() => {
    window.addEventListener('keydown', handleEnter as EventListener);
    return () => {
      window.removeEventListener('keydown', handleEnter as EventListener);
    };
  }, [openChannelModal, loginData, amount, peerAddress]);

  const getAliasByPeerId = (peerId: string): string => {
    if (aliases && peerId && peerIdToAliasLink[peerId]) return `${peerIdToAliasLink[peerId]} (${peerId})`;
    return peerId;
  };

  const handleOpenChannelDialog = () => {
    (document.activeElement as HTMLInputElement).blur();
    set_openChannelModal(true);
  };

  const handleCloseModal = () => {
    set_openChannelModal(false);
    set_amount('');
    set_peerAddress(props.peerAddress ? props.peerAddress : '');
  };

  const handleAction = async () => {
    const handleOpenChannel = async (weiValue: string, peerAddress: string) => {
      await dispatch(
        actionsAsync.openChannelThunk({
          apiEndpoint: loginData.apiEndpoint!,
          apiToken: loginData.apiToken ? loginData.apiToken : '',
          amount: weiValue,
          peerAddress: peerAddress,
          timeout: 2 * 60_000,
        }),
      )
        .unwrap()
        .catch(async (e) => {
          const isCurrentApiEndpointTheSame = await dispatch(
            nodeActionsAsync.isCurrentApiEndpointTheSame(loginData.apiEndpoint!),
          ).unwrap();
          if (!isCurrentApiEndpointTheSame) return;

          let errMsg = `Channel to ${peerAddress} failed to be opened`;
          if (e instanceof sdkApiError && e.hoprdErrorPayload?.status)
            errMsg = errMsg + `.\n${e.hoprdErrorPayload.status}`;
          if (e instanceof sdkApiError && e.hoprdErrorPayload?.error)
            errMsg = errMsg + `.\n${e.hoprdErrorPayload.error}`;
          console.error(errMsg, e);
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
        });
    };

    handleCloseModal();
    const parsedOutgoing = parseFloat(amount ?? '0') >= 0 ? amount ?? '0' : '0';
    const weiValue = ethers.utils.parseEther(parsedOutgoing).toString();
    await handleOpenChannel(weiValue, peerAddress);
    dispatch(
      actionsAsync.getChannelsThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
      }),
    );
  };

  function handleEnter(event: KeyboardEvent) {
    if (openChannelModal && canOpen && event.key === 'Enter') {
      console.log('OpenChannelModal event');
      handleAction();
    }
  }

  return (
    <>
      <IconButton
        iconComponent={<AddChannelIcon />}
        disabled={props.disabled}
        pending={channelIsBeingOpened}
        tooltipText={
          props.tooltip ? (
            props.tooltip
          ) : (
            <span>
              OPEN
              <br />
              outgoing channel
            </span>
          )
        }
        onClick={handleOpenChannelDialog}
      />
      <SDialog
        open={openChannelModal}
        onClose={handleCloseModal}
        disableScrollLock={true}
      >
        <TopBar>
          <DialogTitle>Open Outgoing Channel</DialogTitle>
          <SIconButton
            aria-label="close modal"
            onClick={handleCloseModal}
          >
            <CloseIcon />
          </SIconButton>
        </TopBar>
        <SDialogContent>
          <TextField
            label="Node Address"
            value={peerAddress}
            placeholder="0x4f5a...1728"
            onChange={(e) => set_peerAddress(e.target.value)}
            sx={{ mt: '6px' }}
            autoFocus={peerAddress === ''}
          />
          <TextField
            label="Amount"
            type="string"
            placeholder="Amount"
            value={amount}
            onChange={(e) => set_amount(e.target.value)}
            InputProps={{ endAdornment: <InputAdornment position="end">{HOPR_TOKEN_USED}</InputAdornment> }}
            sx={{ mt: '6px' }}
            autoFocus={peerAddress !== ''}
          />
        </SDialogContent>
        <DialogActions>
          <Button
            onClick={handleAction}
            disabled={!canOpen}
            style={{
              marginRight: '16px',
              marginBottom: '6px',
              marginTop: '-6px',
            }}
          >
            Open Channel
          </Button>
        </DialogActions>
      </SDialog>
    </>
  );
};
