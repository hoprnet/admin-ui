import React, { useRef, KeyboardEvent } from 'react';
import styled from '@emotion/styled';
import { HOPR_TOKEN_USED } from '../../../../config';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
DialogTitle,
InputAdornment,
MenuItem,
Button as MuiButton,
TextField,
} from '@mui/material'
import Button from '../../../future-hopr-lib-components/Button';
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import { sendNotification } from '../../../hooks/useWatcher/notifications';
import CloseIcon from '@mui/icons-material/Close';
import WithdrawIcon from '../../../future-hopr-lib-components/Icons/Withdraw';
import LaunchIcon from '@mui/icons-material/Launch';
import { nodeActionsAsync } from '../../../store/slices/node';
import { parseEther, isAddress } from 'viem';
import { utils as hoprdUtils } from '@hoprnet/hopr-sdk';
const { sdkApiError } = hoprdUtils;

// Store
import { actionsAsync } from '../../../store/slices/node/actionsAsync';

const Content = styled(SDialogContent)`
  gap: 1rem;
  & button {
    align-self: center;
    padding-inline: 2rem;
  }
`;

const TextFieldWithoutArrows = styled(TextField)`
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Firefox */
  input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
  &:disabled {
    pointer-events: none;
  }
`;

const MaxButton = styled(MuiButton)`
  background-color: #ffffa0;
  border-radius: 2px;
  border: none;
  color: #444;
  font-weight: 600;
  padding: 0.2rem 1rem;
  &:disabled {
    background-color: #e0e0e0;
    color: #a6a6a6;
  }
`;

const GnosisLink = styled.a`
  display: inline-flex;
  gap: 2px;
  text-decoration: underline;
  & svg {
    align-self: flex-end;
    height: 16px;
    width: 16px;
  }
`;

type WithdrawModalProps = {
  initialCurrency?: 'HOPR' | 'NATIVE';
};

const WithdrawModal = ({ initialCurrency }: WithdrawModalProps) => {
  // hooks
  const dispatch = useAppDispatch();
  const hoprBalance = useAppSelector((state) => state.node.balances.data.hopr);
  const nativeBalance = useAppSelector((state) => state.node.balances.data.native);
  const safeAddress = useAppSelector((state) => state.node.info.data?.hoprNodeSafe);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const {
apiEndpoint,
apiToken,
} = useAppSelector((state) => state.auth.loginData);
  // local states
  const [openModal, set_openModal] = useState(false);
  const [currency, set_currency] = useState<'HOPR' | 'NATIVE'>(initialCurrency ?? 'NATIVE');
  const [amount, set_amount] = useState<string>('');
  const [maxAmount, set_maxAmount] = useState<string>(nativeBalance.value ?? '');
  const [recipient, set_recipient] = useState<string>('');
  const [isLoading, set_isLoading] = useState(false);
  const [transactionHash, set_transactionHash] = useState('');

  const withdrawingZeroOrLess = amount ? parseEther(amount) <= parseEther('0') : false;
  const withdrawingMoreThanTheWallet = amount ? parseEther(amount) > parseEther(maxAmount) : false;
  const validatedEthAddress = isAddress(recipient);
  const canWithdraw = !(
    !recipient ||
    !amount ||
    withdrawingZeroOrLess ||
    withdrawingMoreThanTheWallet ||
    !validatedEthAddress
  );

  useEffect(() => {
    setMaxAmount();
  }, [currency, nativeBalance.value]);

  useEffect(() => {
    window.addEventListener('keydown', handleEnter);
    return () => {
      window.removeEventListener('keydown', handleEnter);
    };
  }, [recipient, amount, apiEndpoint, apiToken, currency, loginData]);

  const handleOpenModal = () => {
    (document.activeElement as HTMLInputElement).blur();
    set_openModal(true);
  };

  const handleCloseModal = () => {
    set_openModal(false);
  };

  const setAmount = () => {
    setMaxAmount();
    if (currency === 'HOPR' && hoprBalance.formatted) {
      set_amount(hoprBalance.formatted);
    } else if (currency === 'NATIVE' && nativeBalance.formatted) {
      set_amount(nativeBalance.formatted);
    }
  };

  const setMaxAmount = () => {
    if (currency === 'HOPR' && hoprBalance.formatted) {
      set_maxAmount(hoprBalance.formatted);
    } else if (currency === 'NATIVE' && nativeBalance.formatted) {
      set_maxAmount(nativeBalance.formatted);
    }
  };

  //TODO: add get balances after the call
  const handleWithdraw = async () => {
    if (recipient && amount && apiEndpoint) {
      set_isLoading(true);
      set_transactionHash('');
      await dispatch(
        nodeActionsAsync.withdrawThunk({
          amount: parseEther(amount).toString(),
          currency,
          address: recipient,
          apiEndpoint,
          apiToken: apiToken ? apiToken : '',
          timeout: 240_000,
        }),
      )
        .unwrap()
        .then((hash) => {
          set_transactionHash(hash ?? '');
        })
        .catch(async (e) => {
          const isCurrentApiEndpointTheSame = await dispatch(
            actionsAsync.isCurrentApiEndpointTheSame(loginData.apiEndpoint!),
          ).unwrap();
          if (!isCurrentApiEndpointTheSame) return;

          let errMsg = `Withdrawing ${currency === 'NATIVE' ? 'xDai' : 'HOPR'} failed`;
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
        })
        .finally(() => {
          set_isLoading(false);
        });
    }
  };

  function handleEnter(event: any) {
    if (canWithdraw && (event as KeyboardEvent)?.key === 'Enter') {
      console.log('WithdrawModal event');
      handleWithdraw();
    }
  }

  return (
    <>
      <IconButton
        iconComponent={<WithdrawIcon />}
        tooltipText={
          <span>
            WITHDRAW
            <br />
            tokens
          </span>
        }
        onClick={handleOpenModal}
      />
      <SDialog
        open={openModal}
        onClose={handleCloseModal}
        disableScrollLock={true}
      >
        <TopBar>
          <DialogTitle>Withdraw tokens</DialogTitle>
          <SIconButton
            aria-label="close modal"
            onClick={handleCloseModal}
          >
            <CloseIcon />
          </SIconButton>
        </TopBar>
        <Content>
          <>
            <TextField
              label="Currency"
              placeholder="Currency"
              value={currency}
              onChange={(e) => {
                const { value } = e.target;
                if (value !== 'HOPR' && value !== 'NATIVE') return;
                set_currency(value);
              }}
              select
            >
              <MenuItem
                value={'NATIVE'}
                disabled={!nativeBalance.value || nativeBalance.value === '0'}
              >
                xDai
              </MenuItem>
              <MenuItem
                value={'HOPR'}
                disabled={!hoprBalance.value || hoprBalance.value === '0'}
              >
                {HOPR_TOKEN_USED}
              </MenuItem>
            </TextField>
            <TextFieldWithoutArrows
              type="number"
              label="Amount"
              placeholder="Amount"
              value={amount}
              onChange={(e) => set_amount(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <MaxButton onClick={setAmount}>Max</MaxButton>
                  </InputAdornment>
                ),
                inputProps: { min: 0, step: 'any' },
              }}
              autoFocus
            />
            <TextField
              type="text"
              label="Recipient"
              placeholder={
                safeAddress ? `${safeAddress.substring(0, 6)}...${safeAddress.substring(38)}` : '0x4f5a...1728'
              }
              value={recipient}
              onChange={(e) => {
                console.log('rec', e.target.value);
                set_recipient(e.target.value);
              }}
            />
            <Button
              onClick={handleWithdraw}
              pending={isLoading}
              disabled={!canWithdraw}
            >
              Withdraw
            </Button>
            {transactionHash && (
              <p>
                Check your transaction{' '}
                <GnosisLink
                  href={`https://gnosisscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                  <LaunchIcon />
                </GnosisLink>
              </p>
            )}
          </>
        </Content>
      </SDialog>
    </>
  );
};

export default WithdrawModal;
