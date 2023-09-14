import styled from '@emotion/styled';
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Address, parseUnits } from 'viem';
import { GNOSIS_CHAIN_HOPR_BOOST_NFT, wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS, xHOPR_TOKEN_SMART_CONTRACT_ADDRESS } from '../../../config';
import { useEthersSigner } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store';
import { safeActions, safeActionsAsync } from '../../store/slices/safe';
import { createSendNftTransactionData, createSendTokensTransactionData } from '../../utils/blockchain';

// components
import Card from '../../components/Card';
import NetworkOverlay from '../../components/NetworkOverlay';
import Button from '../../future-hopr-lib-components/Button';
import Section from '../../future-hopr-lib-components/Section';

// Mui
import { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Select from '../../future-hopr-lib-components/Select';
import { browserClient } from '../../providers/wagmi';
import { getUserActionForPendingTransaction, getUserCanSkipProposal } from '../../utils/safeTransactions';

const StyledForm = styled.div`
  width: 100%;
  display: flex;
  align-items: baseline;
  gap: 1rem;
  border-bottom: 1px solid #414141;
  justify-content: center;
  padding-bottom: 16px;
`;

const StyledInstructions = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledText = styled.h3`
  color: var(--414141, #414141);
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  letter-spacing: 0.35px;
  text-align: end;
`;

const StyledDescription = styled.p`
  color: #414141;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 21px;
  letter-spacing: 0.35px;
`;

const StyledInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: baseline;
  gap: 10px;
`;

const StyledCoinLabel = styled.p`
  color: var(--414141, #414141);
  font-size: 15px;
  font-style: normal;
  font-weight: 400;
  letter-spacing: 0.35px;
`;

const StyledButtonGroup = styled.div`
  margin-top: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
`;

const StyledBlueButton = styled(Button)`
  text-transform: uppercase;
  padding: 0.2rem 4rem;
`;

const StyledPendingSafeTransactions = styled.div`
  display: flex;
  flex-direction: column;
`;

const InputWithLabel = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
`;

const SUPPORTED_TOKENS = {
  xdai: {
    value: 'xdai',
    name: 'xDai',
  },
  wxhopr: {
    name: 'wxHOPR',
    value: 'wxhopr',
    smartContract: wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
  },
  xhopr: {
    name: 'xHOPR',
    value: 'xhopr',
    smartContract: xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
  },
  nft: {
    name: 'NFT',
    value: 'nft',
    smartContract: GNOSIS_CHAIN_HOPR_BOOST_NFT,
  },
} as const;

function SafeWithdraw() {
  const dispatch = useAppDispatch();
  // hooks
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');
  const pendingTransactions = useAppSelector((store) => store.safe.pendingTransactions.data);
  const selectedSafeAddress = useAppSelector((store) => store.safe.selectedSafeAddress.data);
  const safeInfo = useAppSelector((store) => store.safe.info.data);
  const address = useAppSelector((store) => store.web3.account);
  const communityNftIds = useAppSelector((store) => store.safe.communityNftIds.data);
  const safeBalances = useAppSelector((store) => store.safe.balance.data);
  const signer = useEthersSigner();
  // local state
  const [userCanSkipProposal, set_userCanSkipProposal] = useState(false);
  const [userAction, set_userAction] = useState<'EXECUTE' | 'SIGN' | null>(null);
  const [ethValue, set_ethValue] = useState<string>('');
  const [nftId, set_nftId] = useState<string>('');
  const [receiver, set_receiver] = useState<string>('');
  const [token, set_token] = useState<keyof typeof SUPPORTED_TOKENS>(
    tokenParam && tokenParam in SUPPORTED_TOKENS ? (tokenParam as keyof typeof SUPPORTED_TOKENS) : 'xdai',
  );
  const [isSigning, set_isSigning] = useState<boolean>();
  const [isExecuting, set_isExecuting] = useState<boolean>();
  const [proposedTxHash, set_proposedTxHash] = useState<string>();
  const [proposedTx, set_proposedTx] = useState<SafeMultisigTransactionResponse>();

  useEffect(() => {
    if (proposedTxHash) {
      const foundProposedTx = pendingTransactions?.results.find((tx) => tx.transactionHash === proposedTxHash);
      if (foundProposedTx && address) {
        set_proposedTx(foundProposedTx);
        set_userAction(getUserActionForPendingTransaction(foundProposedTx, address));
      }
    }
  }, [pendingTransactions, proposedTxHash, address]);

  useEffect(() => {
    set_userCanSkipProposal(getUserCanSkipProposal(safeInfo));
  }, [safeInfo]);

  const proposeTx = () => {
    if (signer && selectedSafeAddress) {
      set_isSigning(true);

      if (token === 'xdai') {
        const parsedValue = Number(ethValue) ? parseUnits(ethValue as `${number}`, 18).toString() : 0;
        return dispatch(
          safeActionsAsync.createSafeTransactionThunk({
            signer,
            safeAddress: selectedSafeAddress,
            safeTransactionData: {
              to: receiver,
              value: parsedValue as string,
              data: '0x',
            },
          }),
        )
          .unwrap()
          .then((safeTxHash) => {
            set_proposedTxHash(safeTxHash);
          })
          .finally(() => {
            set_isSigning(false);
          });
      }
      if (token === 'nft') {
        const smartContractAddress = SUPPORTED_TOKENS[token].smartContract;
        return dispatch(
          safeActionsAsync.createSafeContractTransaction({
            data: createSendNftTransactionData(selectedSafeAddress as Address, receiver as Address, Number(nftId)),
            signer,
            safeAddress: selectedSafeAddress,
            smartContractAddress,
          }),
        )
          .unwrap()
          .then((transactionResponse) => {
            set_proposedTxHash(transactionResponse);
          })
          .finally(() => {
            set_isExecuting(false);
          });
      } else {
        const smartContractAddress = SUPPORTED_TOKENS[token].smartContract;
        const parsedValue = Number(ethValue) ? parseUnits(ethValue as `${number}`, 18).toString() : BigInt(0);
        return dispatch(
          safeActionsAsync.createSafeContractTransaction({
            data: createSendTokensTransactionData(receiver as `0x${string}`, parsedValue as bigint),
            signer,
            safeAddress: selectedSafeAddress,
            smartContractAddress,
          }),
        )
          .unwrap()
          .then((safeTxHash) => {
            set_proposedTxHash(safeTxHash);
          })
          .finally(() => {
            set_isSigning(false);
          });
      }
    }
  };

  const executeTx = async () => {
    set_isExecuting(true);
    if (proposedTxHash && signer && selectedSafeAddress) {
      const safeTx = pendingTransactions?.results.find((tx) => {
        if (tx.safeTxHash === proposedTxHash) {
          return true;
        }
        return false;
      });

      if (safeTx) {
        await dispatch(
          safeActionsAsync.executePendingTransactionThunk({
            safeAddress: selectedSafeAddress,
            signer,
            safeTransaction: safeTx,
          }),
        )
          .unwrap()
          .finally(() => {
            set_isExecuting(false);
          });
      } else {
        set_isExecuting(false);
      }
    }
  };

  const createAndExecuteTx = async () => {
    if (signer && selectedSafeAddress) {
      set_isExecuting(true);
      if (token === 'xdai') {
        const parsedValue = Number(ethValue) ? parseUnits(ethValue as `${number}`, 18).toString() : 0;
        return dispatch(
          safeActionsAsync.createAndExecuteTransactionThunk({
            signer,
            safeAddress: selectedSafeAddress,
            safeTransactionData: {
              to: receiver,
              value: parsedValue as string,
              data: '0x',
            },
          }),
        )
          .unwrap()
          .then((transactionResponse) => {
            set_proposedTxHash(transactionResponse);
          })
          .finally(() => {
            set_isExecuting(false);
          });
      }
      if (token === 'nft') {
        const smartContractAddress = SUPPORTED_TOKENS[token].smartContract;

        await dispatch(
          safeActionsAsync.createAndExecuteContractTransactionThunk({
            data: createSendNftTransactionData(selectedSafeAddress as Address, receiver as Address, Number(nftId)),
            signer,
            safeAddress: selectedSafeAddress,
            smartContractAddress,
          }),
        )
          .unwrap()
          .then((transactionResponse) => {
            browserClient?.waitForTransactionReceipt({ hash: transactionResponse as Address })
              .then(() => {
                dispatch(safeActions.removeCommunityNftsOwnedBySafe(nftId));
              });
            set_proposedTxHash(transactionResponse);
          })
          .finally(() => {
            set_isExecuting(false);
          });
      } else {
        const smartContractAddress = SUPPORTED_TOKENS[token].smartContract;
        const parsedValue = Number(ethValue) ? parseUnits(ethValue as `${number}`, 18).toString() : BigInt(0);
        return dispatch(
          safeActionsAsync.createAndExecuteContractTransactionThunk({
            data: createSendTokensTransactionData(receiver as `0x${string}`, parsedValue as bigint),
            signer,
            safeAddress: selectedSafeAddress,
            smartContractAddress,
          }),
        )
          .unwrap()
          .then((transactionResponse) => {
            set_proposedTxHash(transactionResponse);
          })
          .finally(() => {
            set_isExecuting(false);
          });
      }
    }
  };

  const getErrorsForSafeTx = ({ customValidator }: { customValidator?: () => { errors: string[] } }) => {
    const errors: string[] = [];

    if (!signer) {
      errors.push('wallet is required');
    }

    if (!selectedSafeAddress) {
      errors.push('safe is required');
    }

    if (!receiver) {
      errors.push('receiver is required');
    }

    // only require xDai value if there
    // is no proposed tx
    if (!ethValue && !proposedTx && token !== 'nft') {
      errors.push('xDai value is required');
    }

    if (token === 'nft' && !nftId) {
      errors.push('NFT required');
    }

    if (customValidator) {
      const customErrors = customValidator();
      errors.push(...customErrors.errors);
    }

    return errors;
  };

  const getErrorsForApproveButton = () =>
    getErrorsForSafeTx({ customValidator: () => {
      return Number(ethValue) ? { errors: [] } : { errors: ['xdai value is required'] };
    } });

  const getErrorsForExecuteButton = () =>
    getErrorsForSafeTx({ customValidator: () => {
      // no user action means the user can not do anything
      return !userAction ? { errors: [] } : { errors: ['transaction requires more approvals'] };
    } });

  const handleChangeToken = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as string;
    if (value in SUPPORTED_TOKENS) {
      set_token(value as keyof typeof SUPPORTED_TOKENS);
      setSearchParams(`token=${value}`);
    }
  };

  const handleChangeNftId = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as string;
    if (value) {
      set_nftId(value);
    }
  };

  const getTokenAvailable = (token: keyof typeof SUPPORTED_TOKENS): boolean => {
    if (token === 'nft') {
      return !!communityNftIds.length;
    } else if (token === 'xdai') {
      return !!safeBalances.xDai.value && BigInt(safeBalances.xDai.value) > BigInt(0);
    } else if (token === 'wxhopr') {
      return !!safeBalances.wxHopr.value && BigInt(safeBalances.wxHopr.value) > BigInt(0);
    } else if (token === 'xhopr') {
      return !!safeBalances.xHopr.value && BigInt(safeBalances.xHopr.value) > BigInt(0);
    }

    return false;
  };

  // multiple owners is out of scope for initial version
  // const handleApprove = () => {
  //   if (signer && proposedTx) {
  //     dispatch(
  //       safeActionsAsync.confirmTransactionThunk({
  //         signer,
  //         safeAddress: proposedTx.safe,
  //         safeTransactionHash: proposedTx.safeTxHash,
  //       }),
  //     );
  //   }
  // };

  return (
    <Section
      lightBlue
      center
      fullHeightMin
    >
      <Card
        image={{
          src: '/assets/funds-safe-withdraw.svg',
          height: 130,
          alt: 'Withdraw Token from Safe',
        }}
        title="Withdraw from Safe"
      >
        <div>
          <StyledForm>
            <StyledInstructions>
              <StyledText>WITHDRAW</StyledText>
            </StyledInstructions>
            <StyledInputGroup>
              <InputWithLabel>
                <Select
                  size="small"
                  values={Object.values(SUPPORTED_TOKENS).map((t) => ({
                    name: t.name,
                    value: t.value,
                    disabled: !getTokenAvailable(t.value),
                  }))}
                  value={token}
                  onChange={handleChangeToken}
                  style={{
                    width: '230px',
                    margin: 0,
                  }}
                />
                <StyledCoinLabel>Token</StyledCoinLabel>
              </InputWithLabel>
              <InputWithLabel>
                <TextField
                  variant="outlined"
                  placeholder="-"
                  size="small"
                  value={receiver}
                  onChange={(e) => set_receiver(e.target.value)}
                  InputProps={{ inputProps: { style: { textAlign: 'right' } } }}
                />
                <StyledCoinLabel>Receiver</StyledCoinLabel>
              </InputWithLabel>
              {token === 'nft' ? (
                <InputWithLabel>
                  <Select
                    size="small"
                    values={Object.values(communityNftIds).map((nft) => ({
                      name: nft.id,
                      value: nft.id,
                    }))}
                    value={nftId}
                    onChange={handleChangeNftId}
                    style={{
                      width: '230px',
                      margin: 0,
                    }}
                  />
                  <StyledCoinLabel>NFT ID</StyledCoinLabel>
                </InputWithLabel>
              ) : (
                <InputWithLabel>
                  <TextField
                    variant="outlined"
                    placeholder="-"
                    size="small"
                    value={ethValue}
                    onChange={(e) => set_ethValue(e.target.value)}
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                    }}
                    InputProps={{ inputProps: { style: { textAlign: 'right' } } }}
                  />
                  <StyledCoinLabel>{SUPPORTED_TOKENS[token].name}</StyledCoinLabel>
                </InputWithLabel>
              )}
            </StyledInputGroup>
          </StyledForm>
          {!!proposedTx && (
            <StyledPendingSafeTransactions>
              <StyledDescription>
                {userAction === 'EXECUTE'
                  ? 'transaction has been approved by required owners, now can be executed'
                  : `transaction is pending ${
                    (proposedTx?.confirmationsRequired ?? 0) - (proposedTx?.confirmations?.length ?? 0)
                  } approvals`}
              </StyledDescription>
              {/* Multiple owners are out of scope, leaving the code here for the future */}
              {/* {!transactionHasEnoughApprovals() && (
                <StyledApproveButton onClick={handleApprove}>approve/sign</StyledApproveButton>
              )} */}
            </StyledPendingSafeTransactions>
          )}
          <StyledButtonGroup>
            {!userCanSkipProposal ? (
              <Tooltip title={isSigning ? 'Signing transaction' : getErrorsForApproveButton().at(0)}>
                <span>
                  <StyledBlueButton
                    disabled={!!getErrorsForApproveButton().length || isSigning}
                    onClick={proposeTx}
                  >
                    Sign
                  </StyledBlueButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip title={isExecuting ? 'Executing transaction' : getErrorsForExecuteButton().at(0)}>
                <span>
                  <StyledBlueButton
                    disabled={!!getErrorsForExecuteButton().length || isExecuting}
                    pending={isExecuting}
                    // no need to propose tx with only 1 threshold
                    onClick={proposedTx ? executeTx : createAndExecuteTx}
                  >
                    Execute
                  </StyledBlueButton>
                </span>
              </Tooltip>
            )}
          </StyledButtonGroup>
          {isSigning && <p>Signing transaction with nonce...</p>}
        </div>
      </Card>
      <NetworkOverlay />
    </Section>
  );
}

export default SafeWithdraw;
