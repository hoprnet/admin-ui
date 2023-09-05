import { useState } from 'react';
import styled from '@emotion/styled';
import Button from '../../../../future-hopr-lib-components/Button';
import GrayButton from '../../../../future-hopr-lib-components/Button/gray';
import { StepContainer, ConfirmButton } from '../components';
import { useEthersSigner } from '../../../../hooks';
import { getAddress } from 'viem';

// Mui
import { TextField } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

// Store
import { useAppSelector, useAppDispatch } from '../../../../store';
import { stakingHubActions } from '../../../../store/slices/stakingHub';
import { safeActionsAsync } from '../../../../store/slices/safe';

const StyledGrayButton = styled(GrayButton)`
  border: 1px solid black;
  height: 39px;
`;

export default function AddNode() {
  const dispatch = useAppDispatch();
  const safeAddress = useAppSelector((store) => store.safe.selectedSafeAddress.data);
  
  //http://localhost:5173/staking/onboarding?HOPRdNodeAddressForOnboarding=helloMyfield
  const HOPRdNodeAddressForOnboarding = useAppSelector((store) => store.stakingHub.onboarding.nodeAddressProvidedByMagicLink);
  const nodesAddedToSafe = useAppSelector(
    (store) => store.stakingHub.safeInfo.data.registeredNodesInNetworkRegistryParsed,
  );
  const account = useAppSelector((store) => store.web3.account);
  const signer = useEthersSigner();
  const [isLoading, set_isLoading] = useState(false);
  const [address, set_address] = useState(HOPRdNodeAddressForOnboarding ? HOPRdNodeAddressForOnboarding : '');
  const nodeInNetworkRegistry = nodesAddedToSafe.includes(address.toLocaleLowerCase());

  const addDelegate = async () => {
    if (signer && safeAddress && account) {
      set_isLoading(true);
      await dispatch(
        safeActionsAsync.addSafeDelegateThunk({
          signer,
          options: {
            safeAddress,
            delegateAddress: getAddress(address),
            delegatorAddress: account,
            label: 'node',
          },
        }),
      ).unwrap();
      dispatch(stakingHubActions.setOnboardingNodeAddress(address));
      set_isLoading(false);
      dispatch(stakingHubActions.setOnboardingStep(13));
    }
  };

  return (
    <StepContainer
      title="ADD NODE"
      description={
        <>
          Please enter and confirm your node address. This will initiate a transaction which you will need to sign. If you do not have your node address follow the instructions here for{' '}
          <a
            href="https://docs.hoprnet.org/node/using-dappnode#2-link-your-node-to-your-safe"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline'}}
          >
            Dappnode
          </a>
          {' '}or{' '}
          <a
            href="https://docs.hoprnet.org/node/using-docker#4-link-your-node-to-your-safe"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline'}}
          >
            Docker
          </a>
          .
        </>
      }
      image={{
        src: '/assets/node-blue.svg',
        height: 200,
      }}
      buttons={
        <>
        <StyledGrayButton
          onClick={() => {
            dispatch(stakingHubActions.setOnboardingStep(11));
          }}
        >
          Back
        </StyledGrayButton>
        <Tooltip title={address === '' ? 'Please enter and confirm your node address': !nodeInNetworkRegistry && 'This node is not on the whitelist'}>
          <span>
            <ConfirmButton
              onClick={addDelegate}
              disabled={!nodeInNetworkRegistry}
              pending={isLoading}
              style={{width: '250px'}}
            >
              CONTINUE
            </ConfirmButton>
          </span>
        </Tooltip>
      </>
      }
    >
      <TextField
        type="text"
        label="Node Address"
        placeholder="Your address..."
        value={address}
        onChange={(e) => set_address(e.target.value)}
        fullWidth
        style={{marginTop: '16px'}}
        helperText={'Address should start with 0x'}
      />
    </StepContainer>
  );
}
