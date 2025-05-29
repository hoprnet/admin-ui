import { useState, useEffect } from 'react';
import { DialogTitle, TextField, DialogActions, Alert } from '@mui/material';
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import { useAppDispatch, useAppSelector } from '../../../store';
import { actionsAsync } from '../../../store/slices/node/actionsAsync';
import { appActions } from '../../../store/slices/app';
import CloseIcon from '@mui/icons-material/Close';
import { sendNotification } from '../../../hooks/useWatcher/notifications';
import { utils as hoprdUlils } from '@hoprnet/hopr-sdk';
const { sdkApiError } = hoprdUlils;

// HOPR Components
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import AddAliasIcon from '../../../future-hopr-lib-components/Icons/AddAlias';
import Button from '../../../future-hopr-lib-components/Button';

type CreateAliasModalProps = {
  address?: string;
  disabled?: boolean;
  tooltip?: JSX.Element | string;
};

export const CreateAliasModal = (props: CreateAliasModalProps) => {
  const dispatch = useAppDispatch();
  const loginData = useAppSelector((store) => store.auth.loginData);
  const aliases = useAppSelector((store) => store.node.aliases);
  const [alias, set_alias] = useState<string>('');
  const [address, set_address] = useState<string>(props.address ? props.address : '');
  const [duplicateAlias, set_duplicateAlias] = useState(false);
  const [duplicateAddress, set_duplicateAddress] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const aliasesArr = aliases ? Object.keys(aliases) : [];
  const aliasPeerIdsArr = aliases ? Object.values(aliases) : [];
  const aliasIncludesASpace = alias.includes(' ');
  const canAddAlias = !(
    alias.length === 0 ||
    address.length === 0 ||
    duplicateAlias ||
    duplicateAddress ||
    aliasIncludesASpace
  );

  useEffect(() => {
    window.addEventListener('keydown', handleEnter as EventListener);
    return () => {
      window.removeEventListener('keydown', handleEnter as EventListener);
    };
  }, [loginData, alias, address]);

  const setPropAddress = () => {
    if (props.address) set_address(props.address);
  };
  useEffect(setPropAddress, [props.address]);

  const handleChangeAddress = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (aliasPeerIdsArr.includes(event.target.value)) {
      set_duplicateAddress(true);
    } else {
      set_duplicateAddress(false);
    }
    set_address(event.target.value);
  };

  const handleChangeAlias = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (aliasesArr.includes(event.target.value)) {
      set_duplicateAlias(true);
    } else {
      set_duplicateAlias(false);
    }
    set_alias(event.target.value);
  };

  const handleOpenModal = () => {
    (document.activeElement as HTMLInputElement).blur();
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    set_duplicateAlias(false);
    set_duplicateAddress(false);
    setOpenModal(false);
    set_address(props.address ? props.address : '');
    set_alias('');
  };

  const handleAddAlias = () => {
    // if (loginData.apiEndpoint) {
    //   dispatch(
    //     actionsAsync.setAliasThunk({
    //       alias: alias,
    //       peerId: peerId,
    //       apiEndpoint: loginData.apiEndpoint,
    //       apiToken: loginData.apiToken ? loginData.apiToken : '',
    //     }),
    //   )
    //     .unwrap()
    //     .then(() => {
    //       props.handleRefresh();
    //       sendNotification({
    //         notificationPayload: {
    //           source: 'node',
    //           name: `Alias ${alias} added to ${peerId}`,
    //           url: null,
    //           timeout: null,
    //         },
    //         toastPayload: { message: `Alias ${alias} added to ${peerId}` },
    //         dispatch,
    //       });
    //     })
    //     .catch((e) => {
    //       let errMsg = `Alias ${alias} failed to add`;
    //       if (e instanceof sdkApiError && e.hoprdErrorPayload?.status)
    //         errMsg = errMsg + `.\n${e.hoprdErrorPayload.status}`;
    //       if (e instanceof sdkApiError && e.hoprdErrorPayload?.error)
    //         errMsg = errMsg + `.\n${e.hoprdErrorPayload.error}`;
    //       console.error(errMsg, e);
    //       sendNotification({
    //         notificationPayload: {
    //           source: 'node',
    //           name: errMsg,
    //           url: null,
    //           timeout: null,
    //         },
    //         toastPayload: {
    //           message: errMsg,
    //           type: 'error',
    //         },
    //         dispatch,
    //       });
    //     })
    //     .finally(() => {
    //       handleCloseModal();
    //     });
    // }
  };

  function handleEnter(event: KeyboardEvent) {
    if (canAddAlias && event.key === 'Enter') {
      console.log('AddAliasModal event');
      handleAddAlias();
    }
  }

  return (
    <>
      <IconButton
        iconComponent={<AddAliasIcon />}
        tooltipText={
          props.tooltip ? (
            props.tooltip
          ) : (
            <span>
              ADD
              <br />
              new alias
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
      >
        <TopBar>
          <DialogTitle>Add Alias</DialogTitle>
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
            name="address"
            label="Node address"
            placeholder="0x154a...d6D9E7f3"
            onChange={handleChangeAddress}
            value={address}
            error={duplicateAddress}
            helperText={duplicateAddress ? 'This Peer Id already has an alias!' : ''}
            style={{ minHeight: '79px' }}
            autoFocus={address === ''}
          />
          <TextField
            type="text"
            name="alias"
            label="Alias"
            placeholder="Alias"
            onChange={handleChangeAlias}
            value={alias}
            error={duplicateAlias || alias.includes(' ')}
            helperText={
              duplicateAlias
                ? 'This is a duplicate alias!'
                : aliasIncludesASpace
                ? "An alias can't include a space"
                : ''
            }
            style={{ minHeight: '79px' }}
            autoFocus={address !== ''}
          />
        </SDialogContent>
        <DialogActions>
          <Button
            disabled={!canAddAlias}
            onClick={handleAddAlias}
            style={{
              marginRight: '16px',
              marginBottom: '6px',
              marginTop: '-6px',
            }}
          >
            Add
          </Button>
        </DialogActions>
      </SDialog>
    </>
  );
};
