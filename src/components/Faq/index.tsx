import { useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Card, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import styled from '@emotion/styled';

const StyledCard = styled(Card)`
  display: flex;
  flex-direction: column;
  width: 206px;
  font-size: 12px;
  border-radius: 1rem;
  margin-right: 8px;
  padding: 8px;
  box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14),
    0px 1px 3px 0px rgba(0, 0, 0, 0.12);
  &.blue {
    background-color: #daf8ff;
  }
  &.pink {
    background-color: #ffe7e7;
  }
`;

const StyledChip = styled(Chip)`
  align-self: flex-start;
  font-weight: 700;
  min-width: 7rem;
  text-transform: uppercase;

  &.blue {
    background-color: #0000b2;
    color: #fff;
  }
  &.pink {
    background-color: #ffafa3;
    color: #414141;
  }
`;

const StyledAccordion = styled(Accordion)`
  box-shadow: none;
  border: none;
  margin: 0;

  &::before {
    display: none;
  }

  &.Mui-expanded {
    margin: 0;
  }
`;

const SAccordionSummary = styled(AccordionSummary)`
  border-bottom: 2px solid #414141;
  padding: 0;

  &.Mui-expanded {
    min-height: 48px;
  }
  &.blue {
    background-color: #daf8ff;
  }
  &.pink {
    background-color: #ffe7e7;
  }
  .MuiAccordionSummary-content,
  .MuiAccordionSummary-content.Mui-expanded {
    margin: 4px 2px;
  }
`;

const Title = styled.h3`
  color: #414141;
  font-weight: 700;
  margin: 0;
`;

const AccordionContent = styled(AccordionDetails)`
  margin: 0;
  padding: 0.75rem 0;

  &.blue {
    background-color: #daf8ff;
  }
  &.pink {
    background-color: #ffe7e7;
  }
`;

const Content = styled.div`
  color: #414141;
  overflow-wrap: break-word;

  a {
    color: #007bff; /* Set the desired color for links */
    text-decoration: underline;
  }
`;

type FaqProps = {
  variant: 'blue' | 'pink';
  label: string;
  data: {
    id: number;
    title: string;
    content: string | JSX.Element;
  }[];
};

export default function FAQ({ variant, label, data }: FaqProps) {
  const [expandedId, set_expandedId] = useState<number | false>(false);

  useEffect(() => {
    set_expandedId(false);
  }, [data]);

  const handleAccordionClick = (id: number) => {
    set_expandedId((prevId) => {
      return prevId === id ? false : id;
    });
  };

  return (
    <StyledCard className={`Faq ${variant}`}>
      <StyledChip
        className={`Chip ${variant}`}
        label={label}
      />
      {data.map((faqItem) => (
        <StyledAccordion
          key={faqItem.id}
          expanded={expandedId === faqItem.id}
          onChange={() => handleAccordionClick(faqItem.id)}
        >
          <SAccordionSummary
            className={`SAccordionSummary ${variant}`}
            expandIcon={<ExpandMoreIcon />}
          >
            <Title>{faqItem.title}</Title>
          </SAccordionSummary>
          <AccordionContent className={`Content ${variant}`}>
            <Content>{faqItem.content}</Content>
          </AccordionContent>
        </StyledAccordion>
      ))}
    </StyledCard>
  );
}
