import styled from '@emotion/styled';

import Section from '../future-hopr-lib-components/Section';
import { Card, Chip } from '@mui/material';
import { ReactNode } from 'react';
import Button from '../future-hopr-lib-components/Button';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../store';
import { useBalance } from 'wagmi';

const StyledCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  min-width: 1080px;
`;

const Content = styled.section`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;

  #node-graphic {
    grid-column: 1/3;
    grid-row: 1/3;
  }

  & #remaining-wxhopr-allowance {
    grid-column: 3/4;
  }

  & #earned-rewards {
    grid-column: 4/5;
  }

  & #node-strategy {
    grid-column: 3/4;
  }

  & #redeemed-tickets {
    grid-column: 4/5;
  }

  & #xdai {
    grid-column: 3/4;
  }
`;

const StyledGrayCard = styled(Card)`
  background-color: #edf2f7;
  color: #414141;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CardTitle = styled.h4`
  font-weight: 700;
  margin: 0;
`;

const CardValue = styled.h5`
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0;
`;

const CardCurrency = styled.p`
  font-size: 0.75rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
`;

const ValueAndCurrency = styled.div`
  align-items: flex-end;
  display: flex;
  gap: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StyledChip = styled(Chip)<{ color: string }>`
  align-self: flex-start;
  background-color: ${(props) => props.color === 'error' && '#ffcbcb'};
  background-color: ${(props) => props.color === 'success' && '#cbffd0'};
  color: ${(props) => props.color === 'error' && '#c20000'};
  color: ${(props) => props.color === 'success' && '#00c213'};
  font-weight: 700;
`;

const NodeGraphic = styled.div`
  box-sizing: border-box;
  background-color: #d3f6ff;
  display: grid;
  min-height: 100%;
  max-width: 250px;
  padding: 3rem;
  place-items: center;
`;

const NodeInfo = styled.div``;

type GrayCardProps = {
  id: string;
  title?: string;
  value?: string;
  currency?: 'xDAI' | 'xHOPR' | 'wxHOPR' | string;
  chip?: {
    label: string;
    color: 'success' | 'error' | 'primary';
  };
  buttons?: {
    text: string;
    link: string;
    disabled?: boolean;
  }[];
  children?: ReactNode;
};

const GrayCard = ({
  id,
  title,
  value,
  currency,
  chip,
  buttons,
  children,
}: GrayCardProps) => {
  return (
    <StyledGrayCard id={id}>
      {(title || value) && (
        <CardContent>
          {title && <CardTitle>{title}</CardTitle>}
          {value && (
            <ValueAndCurrency>
              <CardValue>{value}</CardValue>
              {currency && <CardCurrency>{currency}</CardCurrency>}
            </ValueAndCurrency>
          )}
        </CardContent>
      )}
      {chip && (
        <StyledChip
          label={chip.label}
          color={chip.color}
        />
      )}
      {buttons && (
        <ButtonGroup>
          {buttons.map((button) => (
            <Button
              key={button.text}
              disabled={button.disabled}
              nofade
            >
              <Link to={button.link}>{button.text}</Link>
            </Button>
          ))}
        </ButtonGroup>
      )}
      {children}
    </StyledGrayCard>
  );
};

const NodeAdded = () => {
  const selectedSafeAddress = useAppSelector((selector) => selector.safe.selectedSafeAddress) as `0x${string}`;

  const { data: xDAI_balance } = useBalance({
    address: selectedSafeAddress,
    watch: true,
  });
  return (
    <Section
      lightBlue
      center
      fullHeightMin
    >
      <StyledCard>
        <Content>
          <GrayCard id="node-graphic">
            <NodeGraphic>
              <img
                src="/assets/node-graphic.svg"
                alt="Node Graphic"
              />
            </NodeGraphic>
            <NodeInfo></NodeInfo>
          </GrayCard>
          <GrayCard
            id="remaining-wxhopr-allowance"
            title="Remaining wxHOPR Allowance"
            value="0"
            currency="wxHOPR"
            buttons={[
              {
                text: 'Adjust',
                link: '#',
                disabled: true,
              },
            ]}
          ></GrayCard>
          <GrayCard
            id="earned-rewards"
            title="Earned rewards"
            value="120,736.00"
            currency="wxHOPR"
            chip={{
              label: '-5%/24h',
              color: 'error',
            }}
          />
          <GrayCard
            id="node-strategy"
            title="Node strategy"
            value="0"
            buttons={[
              {
                text: 'Adjust in node admin',
                link: '#',
                disabled: true,
              },
            ]}
          ></GrayCard>
          <GrayCard
            id="redeemed-tickets"
            title="Redeemed Tickets"
            value="839"
            currency="Ticket/wxHOPR"
            chip={{
              label: '+9%/24h',
              color: 'success',
            }}
          ></GrayCard>
          <GrayCard
            id="xdai"
            title="xDAI"
            value={xDAI_balance?.formatted ?? '0'}
            buttons={[
              {
                text: 'Send to node',
                link: '#',
                disabled: true,
              },
              {
                text: 'Withdraw',
                link: '#',
                disabled: true,
              },
            ]}
          ></GrayCard>
        </Content>
      </StyledCard>
    </Section>
  );
};

export default NodeAdded;
