import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

//Store
import { useAppSelector, useAppDispatch } from '../../../store';
import { stakingHubActions } from '../../../store/slices/stakingHub';

// HOPR Components
import { StepContainer } from './components';
import { Stepper } from '../../../components/Stepper';

//Steps
import WhatYouWillNeedPage from './step0/0whatYouWillNeed';
import CreateSafe from './step0/1createSafe';
import SafeIsReady from './step0/2safeIsReady';
import OptionalNftTransfer from './step1/0optionalNftTransfer';
import XdaiToSafe from './step2/0fundSafe';
import SafeIsFunded from './step2/1safeIsFunded';
import SelectNodeType from './step3/0selectNodeType';
import SetupNodeStep from './step3/1setupYourNode';
import SetupYourDappNode from './step3/1setupYourDappNode';
import JoinWaitListStep from './step4/0joinWaitlist';
import AddedToWhitelist from './step4/1addedToWhitelist';
import AddNode from './step5/0addNode';
import ConfigureNode from './step6/0configureNode';
import FundNode from './step7/0fundNode';
import SetAllowance from './step8/0setAllowance';

const OnboardingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  min-height: calc(100vh - 60px - 80px + 40px);
  padding-left: 16px;
  padding-right: 16px;
  overflow: hidden;
  background: #edfbff;
  padding-bottom: 40px;
`;

export const ONBOARDING_PAGES = {
  WHAT_YOU_WILL_NEED: 0,
  CREATE_SAFE: 1,
  SAFE_IS_READY: 2,
  OPTIONAL_NFT_TRANSFER: 3,
  XDAI_TO_SAFE: 4,
  SAFE_IS_FUNDED: 5,
  SELECT_NODE_TYPE: 6,
  SETUP_NODE: 7,
  SETUP_DAPP_NODE: 8,
  JOIN_WAITLIST: 10,
  ADDED_TO_WHITELIST: 11,
  ADD_NODE: 12,
  CONFIGURE_NODE: 13,
  FUND_NODE: 14,
  SET_ALLOWANCE: 15,
} as const;

function Onboarding() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const onboardingStep = useAppSelector((store) => store.stakingHub.onboarding.step);

  useEffect(() => {
    navigate(`#${onboardingStep}`, { replace: true });
  }, [onboardingStep]);

  function whatIsCompletedStep(page: number) {
    switch (page) {
    case 2:
    case 3:
      return 1;

    default:
      return -1;
    }
  }

  function whatIsCurrentStep(page: number) {
    switch (page) {
    case 4:
      return 1;

    default:
      return 0;
    }
  }

  return (
    <OnboardingContainer className="OnboardingContainer">
      <Stepper
        lastStepDone={whatIsCompletedStep(onboardingStep)}
        currentStep={whatIsCurrentStep(onboardingStep)}
        steps={[
          { name: 'CREATE SAFE' },
          { name: 'OPTIONAL NFT TRANSFER' },
          { name: 'FUND SAFE' },
          { name: 'CHOOSE YOUR NODE SETUP' },
          { name: 'WAITLIST' },
          { name: 'ADD NODE' },
          { name: 'CONFIGURE NODE' },
          { name: 'FUND NODE' },
          { name: 'SET wxHOPR ALLOWANCES' },
        ]}
      />

      {onboardingStep === ONBOARDING_PAGES.WHAT_YOU_WILL_NEED && <WhatYouWillNeedPage />}
      {onboardingStep === ONBOARDING_PAGES.CREATE_SAFE && <CreateSafe />}
      {onboardingStep === ONBOARDING_PAGES.SAFE_IS_READY && <SafeIsReady />}
      {onboardingStep === ONBOARDING_PAGES.OPTIONAL_NFT_TRANSFER && <OptionalNftTransfer />}
      {onboardingStep === ONBOARDING_PAGES.XDAI_TO_SAFE && <XdaiToSafe />}
      {onboardingStep === ONBOARDING_PAGES.SAFE_IS_FUNDED && <SafeIsFunded />}
      {onboardingStep === ONBOARDING_PAGES.SELECT_NODE_TYPE && <SelectNodeType />}
      {onboardingStep === ONBOARDING_PAGES.SETUP_NODE && <SetupNodeStep />}
      {onboardingStep === ONBOARDING_PAGES.SETUP_DAPP_NODE && <SetupYourDappNode />}

      {onboardingStep === ONBOARDING_PAGES.JOIN_WAITLIST && <JoinWaitListStep />}
      {onboardingStep === ONBOARDING_PAGES.ADDED_TO_WHITELIST && <AddedToWhitelist />}
      {onboardingStep === ONBOARDING_PAGES.ADD_NODE && <AddNode />}
      {onboardingStep === ONBOARDING_PAGES.CONFIGURE_NODE && <ConfigureNode />}
      {onboardingStep === ONBOARDING_PAGES.FUND_NODE && <FundNode />}
      {onboardingStep === ONBOARDING_PAGES.SET_ALLOWANCE && <SetAllowance />}

      {onboardingStep === 22 && (
        <StepContainer>
          <button
            onClick={() => {
              dispatch(stakingHubActions.setOnboardingStep(4));
            }}
          >
            Back
          </button>
        </StepContainer>
      )}
    </OnboardingContainer>
  );
}

export default Onboarding;
