// UI
import styled from '@emotion/styled';
import Button from '../../../../future-hopr-lib-components/Button';
import { useEthersSigner } from '../../../../hooks';
import { StepContainer, ConfirmButton } from '../components';
import { Lowercase, StyledCoinLabel, StyledInputGroup, StyledTextField } from '../safeOnboarding/styled';

// Blockchain
import { Address, formatEther, parseEther } from 'viem';
import { HOPR_TOKEN_USED_CONTRACT_ADDRESS } from '../../../../../config';
import { MAX_UINT256, createApproveTransactionData } from '../../../../utils/blockchain';

// Store
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store';
import { safeActionsAsync } from '../../../../store/slices/safe';
import { stakingHubActions } from '../../../../store/slices/stakingHub';


const StyledText = styled.h3`
  color: var(--414141, #414141);
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  letter-spacing: 0.35px;
  text-align: end;
`;


export default function SetAllowance() {
  const dispatch = useAppDispatch();
  const selectedSafeAddress = useAppSelector((store) => store.safe.selectedSafeAddress.data) as Address;
  const nodeAddress = useAppSelector((store) => store.stakingHub.onboarding.nodeAddress) as Address;
  const signer = useEthersSigner();
  const [wxHoprValue, set_wxHoprValue] = useState('');
  const [loading, set_loading] = useState(false);

  const setAllowance = async () => {
    if (signer && selectedSafeAddress && nodeAddress) {
      set_loading(true);
      await dispatch(
        safeActionsAsync.createAndExecuteContractTransactionThunk({
          data: createApproveTransactionData(nodeAddress, BigInt(wxHoprValue)),
          signer,
          safeAddress: selectedSafeAddress,
          smartContractAddress: HOPR_TOKEN_USED_CONTRACT_ADDRESS,
        }),
      )
        .unwrap()
        .then(() => {
          dispatch(stakingHubActions.setOnboardingStep(16));
        })
        .finally(() => {
          set_loading(false);
        });
    }
  };

  return (
    <StepContainer
      title="SET wxHOPR ALLOWANCE"
      description={`Your node will need to access wxHOPR from your safe to fund payment channels on the HOPR network. You can set a maximum allowance to reduce your funds at risk in case your node is ever compromised.`}
      buttons={
        <ConfirmButton
          onClick={setAllowance}
          disabled={BigInt(wxHoprValue) <= BigInt(0) }
          pending={loading}
        >
          EXECUTE
        </ConfirmButton>
      }
    >
      <StyledInputGroup>
        <StyledText>NODE ALLOWANCE</StyledText>
        <StyledTextField
          type="number"
          variant="outlined"
          placeholder="-"
          size="small"
          value={formatEther(BigInt(wxHoprValue))}
          onChange={(e) => set_wxHoprValue(parseEther(e.target.value).toString())}
          InputProps={{ inputProps: {
            style: { textAlign: 'right' },
            min: 0,
            pattern: '[0-9]*',
          } }}
        />
        <StyledCoinLabel>
          <Lowercase>wx</Lowercase>hopr
        </StyledCoinLabel>
        <Button onClick={() => set_wxHoprValue(MAX_UINT256.toString())}>DEFAULT</Button>
      </StyledInputGroup>
    </StepContainer>
  );
}
