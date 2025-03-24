import styled from '@emotion/styled';
import { Paper } from '@mui/material';

const SPaper = styled(Paper)`
  width: 100%;
  max-width: 800px;
  margin: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ImageContainer = styled.div<{ width?: number; height?: number }>`
  height: ${(props) => (props.height ? `${props.height}px` : '200px')};
  width: ${(props) => (props.width ? `${props.width}px` : '100%')};
`;

const Image = styled.img`
  height: 100%;
  width: 100%;
`;

const Title = styled.h2`
  color: #414141;
  font-size: 32px;
  font-weight: 400;
  text-align: center;
  text-transform: uppercase;
  margin: 0;
`;

const Description = styled.p<{ descriptionLeft?: boolean }>`
  color: #414141;
  font-weight: 500;
  margin: 0;
  max-width: 80ch;
  text-align: ${(props) => (props.descriptionLeft ? 'left' : 'center')};
`;

const Children = styled.div``;

type CardProps = {
  image?: {
    src: string;
    alt?: string;
    height?: number;
    width?: number;
  };
  title?: string;
  description?: string;
  descriptionLeft?: boolean;
  children?: JSX.Element;
};

const Card = ({ image, title, description, descriptionLeft, children }: CardProps) => {
  return (
    <SPaper className={'SPaper'}>
      {image && (
        <ImageContainer
          height={image.height}
          width={image.width}
        >
          <Image
            src={image.src}
            alt={image.alt}
          />
        </ImageContainer>
      )}
      {title && <Title>{title}</Title>}
      {description && <Description descriptionLeft={descriptionLeft}>{description}</Description>}
      <Children>{children}</Children>
    </SPaper>
  );
};

export default Card;
