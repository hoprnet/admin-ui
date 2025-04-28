import styled from '@emotion/styled';
import MuiTooltip, { TooltipProps } from '@mui/material/Tooltip';

interface Props extends TooltipProps {
  notWide?: boolean;
}

const Tooltip: React.FC<Props> = (props) => {
  const { className, notWide, ...rest } = props;
  return (
    <MuiTooltip
      classes={{ popper: `STooltip ${className} ${notWide ? 'notWide' : ''}` }}
      {...rest}
    />
  );
};

export default Tooltip;
