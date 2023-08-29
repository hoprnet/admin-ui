import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import Button from '../../../../future-hopr-lib-components/Button';
import { Address } from 'viem';
import { StepContainer } from '../components';
import { useEthersSigner } from '../../../../hooks';
import { parseUnits } from 'viem';
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { getUserActionForPendingTransaction, getUserCanSkipProposal } from '../../../../utils/safeTransactions';

// Store
import { useAppSelector, useAppDispatch } from '../../../../store';
import { safeActionsAsync } from '../../../../store/slices/safe';

// MUI
import TextField from '@mui/material/TextField';


const StyledForm = styled.div`
  width: 100%;
  display: flex;
  align-items: baseline;
  gap: 1rem;
  border-bottom: 1px solid #414141;
`;

const StyledInstructions = styled.div`
  display: flex;
  flex-direction: column;
  width: 250px;
`;

const StyledText = styled.h3`
  color: var(--414141, #414141);
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  letter-spacing: 0.35px;
  text-transform: uppercase;
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
  align-items: baseline;
  gap: 10px;
`;

const StyledCoinLabel = styled.p`
  color: var(--414141, #414141);
  font-size: 15px;
  font-style: normal;
  font-weight: 400;
  line-height: 60px;
  letter-spacing: 0.35px;
  text-transform: uppercase;
`;

const StyledBlueButton = styled(Button)`
  text-transform: uppercase;
  padding: 0.2rem 4rem;
`;


export default function FundNode() {
  const dispatch = useAppDispatch();
  // injected states
  const pendingTransactions = useAppSelector((store) => store.safe.pendingTransactions.data);
  const safeInfo = useAppSelector((store) => store.safe.info.data);
  const selectedSafeAddress = useAppSelector((store) => store.safe.selectedSafeAddress.data);
  const nodeAddress = useAppSelector((store) => store.stakingHub.onboarding.nodeAddress) as Address;
  const walletAddress = useAppSelector((store) => store.web3.account);
  // local states
  const [userCanSkipProposal, set_userCanSkipProposal] = useState(false);
  const [userAction, set_userAction] = useState<'EXECUTE' | 'SIGN' | null>(null);
  const [xdaiValue, set_xdaiValue] = useState<string>('');
  const [isProposalLoading, set_isProposalLoading] = useState<boolean>();
  const [isExecutionLoading, set_isExecutionLoading] = useState<boolean>();
  const [proposedTxHash, set_proposedTxHash] = useState<string>();
  const [proposedTx, set_proposedTx] = useState<SafeMultisigTransactionResponse>();

  const signer = useEthersSigner();

  useEffect(() => {
    if (proposedTxHash) {
      const foundProposedTx = pendingTransactions?.results.find((tx) => tx.safeTxHash === proposedTxHash);
      if (foundProposedTx && walletAddress) {
        set_proposedTx(foundProposedTx);
        set_userAction(getUserActionForPendingTransaction(foundProposedTx, walletAddress));
      }
    }
  }, [pendingTransactions, proposedTxHash, walletAddress]);

  useEffect(() => {
    set_userCanSkipProposal(getUserCanSkipProposal(safeInfo));
  }, [safeInfo]);

  const proposeTx = () => {
    if (signer && Number(xdaiValue) && selectedSafeAddress && nodeAddress) {
      set_isProposalLoading(true);
      dispatch(
        safeActionsAsync.createSafeTransactionThunk({
          signer,
          safeAddress: selectedSafeAddress,
          safeTransactionData: {
            to: nodeAddress,
            value: parseUnits(xdaiValue as `${number}`, 18).toString(),
            data: '0x',
          },
        }),
      )
        .unwrap()
        .then((safeTxHash) => {
          set_proposedTxHash(safeTxHash);
          set_isProposalLoading(false);
        })
        .catch(() => {
          set_isProposalLoading(false);
        });
    }
  };

  const executeTx = () => {
    if (proposedTxHash && signer && selectedSafeAddress) {
      const safeTx = pendingTransactions?.results.find((tx) => {
        if (tx.safeTxHash === proposedTxHash) {
          return true;
        }
        return false;
      });
      if (safeTx) {
        dispatch(
          safeActionsAsync.executePendingTransactionThunk({
            safeAddress: selectedSafeAddress,
            signer,
            safeTransaction: safeTx,
          }),
        );
      }
    }
  };

  const createAndExecuteTx = () => {
    if (!signer || !Number(xdaiValue) || !selectedSafeAddress || !nodeAddress) return;
    set_isExecutionLoading(true);

    dispatch(
      safeActionsAsync.createAndExecuteTransactionThunk({
        signer,
        safeAddress: selectedSafeAddress,
        safeTransactionData: {
          to: nodeAddress,
          value: parseUnits(xdaiValue as `${number}`, 18).toString(),
          data: '0x',
        },
      }),
    )
      .unwrap()
      .then(() => {
        set_isExecutionLoading(false);
      })
      .catch(() => {
        set_isExecutionLoading(false);
      });
  };

  return (
    <StepContainer
      title="Fund Node"
      description={'You need to sign a transaction to connect your node to your existing HOPR safe.'}
    >
      <div>
        <StyledForm>
          <StyledInstructions>
            <StyledText>SEND xdAI to Node</StyledText>
            <StyledDescription>
              Add-in the amount of xDAI you like to transfer from your safe to your node.
            </StyledDescription>
          </StyledInstructions>
          <StyledInputGroup>
            <TextField
              variant="outlined"
              placeholder="-"
              size="small"
              value={xdaiValue}
              onChange={(e) => set_xdaiValue(e.target.value)}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
              }}
              InputProps={{ inputProps: { style: { textAlign: 'right' } } }}
            />
            <StyledCoinLabel>xdai</StyledCoinLabel>
          </StyledInputGroup>
        </StyledForm>
        <StyledBlueButton
          onClick={proposedTx ? executeTx : createAndExecuteTx}
          pending={isExecutionLoading}
        >
          FUND
        </StyledBlueButton>
        {isProposalLoading && <p>Signing transaction with nonce...</p>}
        {isExecutionLoading && <p>Executing transaction with nonce...</p>}
      </div>
    </StepContainer>
  );
}
