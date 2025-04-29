import styled from '@emotion/styled';

// styles
const NumberWithBackground = styled.div`
  min-width: 29px;
  min-height: 29px;
  background-color: #cadeff;
  color: #000050;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.current {
    background-color: #000050;
    color: #ffffff;
  }
`;

const ImageContainer = styled.div<{ width?: number; height?: number }>`
  height: ${(props) => (props.height ? `${props.height}px` : '200px')};
  width: ${(props) => (props.width ? `${props.width}px` : '100%')};
`;

const Image = styled.img`
  height: 29px;
  width: 29px;
`;

const StepContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 2rem;

  :not(:last-child)::after {
    content: '';
    position: absolute;
    left: 14px;
    bottom: -10px;
    height: 16px;
    width: 1px;
    background-color: #414141;
  }
`;

const StepName = styled.div`
  color: #414141;
  max-width: 30ch;

  &.completed {
    color: #a4a4a4;
  }

  &.current {
    font-weight: bold;
  }
`;

const StepperContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

// types
type StepperProps = {
  steps: { name: string }[];
  currentStep: number;
  lastStepDone: number;
  style?: object;
};

type StepState = 'COMPLETED' | 'CURRENT' | 'CURRENT_AND_COMPLETED' | 'PENDING';

type StepProps = {
  name: string;
  position: number;
  state: StepState;
};

type StepIconProps = {
  position: number;
  state: StepState;
};

type StepTextProps = {
  name: string;
  state: StepState;
};

const StepIcon = (props: StepIconProps) => {
  if (props.state === 'COMPLETED' || props.state === 'CURRENT_AND_COMPLETED') {
    return (
      <ImageContainer
        height={29}
        width={29}
      >
        <Image
          src={'/assets/green-check.svg'}
          alt={'green check'}
        />
      </ImageContainer>
    );
  } else {
    return (
      <NumberWithBackground className={props.state === 'CURRENT' ? 'current' : ''}>
        {props.position + 1}
      </NumberWithBackground>
    );
  }
};

const StepText = (props: StepTextProps) => {
  if (props.state === 'COMPLETED') {
    return (
      <StepName className="completed">
        <p>{props.name}</p>
      </StepName>
    );
  } else if (props.state === 'CURRENT' || props.state === 'CURRENT_AND_COMPLETED') {
    return (
      <StepName className="current">
        <p>{props.name}</p>
      </StepName>
    );
  } else {
    // pending
    return (
      <StepName>
        <p>{props.name}</p>
      </StepName>
    );
  }
};

const Step = (props: StepProps) => {
  return (
    <StepContainer>
      <StepIcon
        position={props.position}
        state={props.state}
      />
      <StepText
        name={props.name}
        state={props.state}
      />
    </StepContainer>
  );
};

export const Stepper = (props: StepperProps) => {
  const getStepState = ({ index, currentStep }: { index: number; currentStep: number }): StepState => {
    if (index === currentStep && currentStep === props.lastStepDone) return 'CURRENT_AND_COMPLETED';
    if (index < currentStep) return 'COMPLETED';
    if (index === currentStep) return 'CURRENT';
    return 'PENDING';
  };

  return (
    <StepperContainer style={props.style}>
      {props.steps.map((step, idx) => (
        <Step
          key={idx}
          name={step.name}
          position={idx}
          state={getStepState({
            currentStep: props.currentStep,
            index: idx,
          })}
        />
      ))}
    </StepperContainer>
  );
};
