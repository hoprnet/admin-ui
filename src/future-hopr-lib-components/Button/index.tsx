import { forwardRef, Ref } from 'react';
import styled from '@emotion/styled';
import MuiButton, { ButtonProps } from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

type StyledButtonProps = ButtonProps & {
  imageOnly?: boolean;
  size70?: boolean;
  standardWidth?: boolean;
  fade?: boolean;
  pending?: boolean;
  nofade?: boolean;
  outlined?: boolean;
  target?: string;
};

const StyledButton = styled(MuiButton)<StyledButtonProps>`
  font-family: 'Source Code Pro';
  text-align: center;
  text-transform: none;
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  border-radius: 20px;
  letter-spacing: 0.25px;
  line-height: 1.5;
  height: unset;
  p {
    margin: 0;
  }

  &.btn-hopr--v2:not(.Mui-disabled) {
    background: linear-gradient(#000050, #0000b4);
    color: #fff;
  }
  &.btn-hopr--standardWidth {
    width: 100%;
    max-width: 222px;
  }
  &.btn-hopr--size70 {
    min-height: 70px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.14999999105930328px;
  }
  &.btn-hopr--image-only {
    padding: 8px;
    width: 70px;
    height: 70px;
    img {
      width: 100%;
      max-width: 54px;
    }
  }
  &.btn-hopr--v2.btn-hopr--fade:not(.Mui-disabled) {
    background: linear-gradient(rgb(0 0 80 / 60%), rgb(0 0 180 / 60%));
  }
  &.white:not(.Mui-disabled) {
    background: #fff;
    color: #0000b2;
    font-weight: 700;
  }

  &.btn-hopr--no-fade:not(.Mui-disabled) {
    align-self: flex-start;
    background: #000050;
    font-size: 12px;
    font-weight: 700;
    height: 32px;
    text-transform: uppercase;
    padding-inline: 0.75rem;
  }

  &.btn-hopr--no-fade {
    &[disabled] {
      background-color: #0000001e;
      box-shadow: none;
      color: #00000042;
      font-size: 12px;
      font-weight: 700;
      height: 32px;
      text-transform: uppercase;
      padding-inline: 0.75rem;
    }
  }

  &.btn-hopr--outlined:not(.Mui-disabled) {
    background: #fff;
    color: #000050;
    border: 2px solid #000050;
  }
`;

const SCircularProgress = styled(CircularProgress)`
  width: 30px !important;
  height: 30px !important;
  position: absolute;
`;

const Button = forwardRef((props: StyledButtonProps, ref: Ref<HTMLButtonElement>) => {
  const { imageOnly, size70, standardWidth, fade, children, nofade, pending, outlined, ...rest } = props;

  const classNames = [
    props.className,
    'btn-hopr--v2',
    imageOnly && 'btn-hopr--image-only',
    size70 && 'btn-hopr--size70',
    standardWidth && 'btn-hopr--standardWidth',
    fade && 'btn-hopr--fade',
    nofade && 'btn-hopr--no-fade',
    outlined && 'btn-hopr--outlined',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <StyledButton
      variant="contained"
      {...rest}
      ref={ref}
      className={classNames}
      disabled={props.disabled || pending}
    >
      {children}
      {pending && <SCircularProgress />}
    </StyledButton>
  );
});

Button.displayName = 'Button'; // Set the display name here

export default Button;
