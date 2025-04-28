import { useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { Container } from './styled';

type CodeCopyBoxProps = {
  code: any;
  copy?: string;
  breakSpaces?: boolean;
};

const CodeCopyBox = ({ code, copy: copyText, breakSpaces }: CodeCopyBoxProps) => {
  const [copied, setCopied] = useState(false);

  const copy = (copyText: string) => {
    navigator.clipboard.writeText(copyText);
  };

  const handleClick = () => {
    copy(copyText ? copyText : code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  return (
    <Tooltip
      title="Copied"
      placement="top"
      open={copied}
      arrow
    >
      <Container onClick={handleClick}>
        <code
          data-testid="copyPullCommandPullCommand"
          className="styles__darkInput___tirFS styles__copyable___2FDeL"
          role="button"
          style={breakSpaces ? { whiteSpace: 'break-spaces' } : {}}
        >
          {code}
        </code>
        <button
          className="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeLarge styles__button___3F4OV css-sti09b"
          type="button"
          data-testid="copyButton"
        >
          <svg
            className="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium css-14yq2cq"
            aria-hidden="true"
            viewBox="0 0 24 24"
            data-testid="FileCopyIcon"
          >
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm-1 4 6 6v10c0 1.1-.9 2-2 2H7.99C6.89 23 6 22.1 6 21l.01-14c0-1.1.89-2 1.99-2h7zm-1 7h5.5L14 6.5V12z"></path>
          </svg>
        </button>
      </Container>
    </Tooltip>
  );
};

export default CodeCopyBox;
