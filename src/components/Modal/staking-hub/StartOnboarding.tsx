import React from 'react';
import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store';
import { DialogTitle } from '@mui/material';
import Button from '../../../future-hopr-lib-components/Button';
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import CloseIcon from '@mui/icons-material/Close';
import { stakingHubActions } from '../../../store/slices/stakingHub';

const Content = styled(SDialogContent)`
  gap: 1rem;
  div {
    display: flex;
    justify-content: center;
    gap: 16px;
    button {
      margin-top: 16px;;
      padding-inline: 2rem;
    }
  }
`;

type WithdrawModalProps = {
  initialCurrency?: 'HOPR' | 'NATIVE';
};

const StartOnboarding = ({ initialCurrency }: WithdrawModalProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notFinished = useAppSelector((state) => state.stakingHub.onboarding.notFinished);
  const notStarted = useAppSelector((state) => state.stakingHub.onboarding.notStarted);
  const modalToSartOnboardingDismissed = useAppSelector((state) => state.stakingHub.onboarding.modalToSartOnboardingDismissed);
  const web3connected = useAppSelector((state) => state.web3.status.connected);
  const [openModal, set_openModal] = useState(false);

  useEffect(() => {
    if (!modalToSartOnboardingDismissed && web3connected && notStarted && !notFinished) handleOpenModal();
    else set_openModal(false);
  }, [web3connected, notFinished, notStarted, modalToSartOnboardingDismissed]);

  const handleOpenModal = () => {
    set_openModal(true);
  };

  const handleCloseModal = () => {
    set_openModal(false);
    dispatch(stakingHubActions.dismissModalToSartOnboarding());
  };

  return (
    <>
      <SDialog
        open={openModal}
        onClick={()=>{handleCloseModal()}}
        disableScrollLock={true}
      >
        <TopBar>
          <DialogTitle>SET UP YOUR HOPR SAFE</DialogTitle>
          <SIconButton
            aria-label="close modal"
            onClick={()=>{handleCloseModal()}}
          >
            <CloseIcon />
          </SIconButton>
        </TopBar>
        <Content>
          <p>Are you ready to create your HOPR Safe?</p>
          <div>
            <Button
              onClick={()=>{handleCloseModal()}}
              outlined
            >
              NOT NOW
            </Button>
            <Button
              onClick={() => {
                navigate(`/staking/onboarding`);
              }}
            >
              CREATE SAFE
            </Button>
          </div>
        </Content>
      </SDialog>
    </>
  );
};

export default StartOnboarding;
