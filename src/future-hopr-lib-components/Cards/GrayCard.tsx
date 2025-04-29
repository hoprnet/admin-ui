import { ReactNode, useState } from 'react';
import styled from '@emotion/styled';
import { Card, Chip, IconButton } from '@mui/material';
import { Link } from 'react-router-dom';
import Button from '../Button';
import Tooltip from '@mui/material/Tooltip';

export type GrayCardProps = {
  id: string;
  title?: string;
  value?: string;
  valueTooltip?: string;
  currency?: string | ReactNode;
  chip?: {
    label: string;
    color: 'success' | 'error';
  };
  buttons?: {
    text: string;
    link?: string;
    disabled?: boolean;
    onClick?: () => void;
    pending?: boolean;
  }[];
  children?: ReactNode;
};

const StyledGrayCard = styled(Card)`
  background-color: #edf2f7;
  display: flex;
  justify-content: space-between;
  padding: 1rem;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 1;
  min-width: 80px;
  flex-grow: 1;
`;

const CardTitle = styled.h4`
  font-weight: 700;
  margin: 0;
`;

const CardValue = styled.h5`
  font-size: 2rem;
  font-weight: 500;
  margin: 0;
`;

const CardCurrency = styled.p`
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
  line-height: 1.4;
`;

const ValueAndCurrency = styled.div`
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 40px;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
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

export const GrayCard = ({ id, title, value, valueTooltip, currency, chip, buttons, children }: GrayCardProps) => {
  return (
    <StyledGrayCard id={id}>
      {(title || value || children) && (
        <CardContent>
          {title && <CardTitle>{title}</CardTitle>}
          {(currency || value) && (
            <ValueAndCurrency>
              {value && valueTooltip ? (
                <Tooltip title={valueTooltip}>
                  <CardValue>{value}</CardValue>
                </Tooltip>
              ) : (
                <CardValue>{value}</CardValue>
              )}
              {currency && <CardCurrency>{currency}</CardCurrency>}
            </ValueAndCurrency>
          )}
          {chip && (
            <StyledChip
              label={chip.label}
              color={chip.color}
            />
          )}
          {children && <div className="content">{children}</div>}
        </CardContent>
      )}
      {buttons && (
        <ButtonGroup>
          {buttons.map((button) => (
            <Button
              key={button.text}
              disabled={button.disabled}
              onClick={button.onClick}
              pending={button.pending}
            >
              {button.link ? <Link to={button.link}>{button.text}</Link> : <p>{button.text}</p>}
            </Button>
          ))}
        </ButtonGroup>
      )}
    </StyledGrayCard>
  );
};
