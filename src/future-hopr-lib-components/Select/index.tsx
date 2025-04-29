import React from 'react';
import styled from '@emotion/styled';

//mui
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import SelectMui, { SelectProps as SelectMuiProps } from '@mui/material/Select';
import { Tooltip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { toHexMD5, generateBase64Jazz } from '../../utils/functions';

const SFormControl = styled(FormControl)`
  margin-bottom: 16px;
  margin-top: 24px;
  label {
    font-size: 17px;
  }
  .MuiOutlinedInput-root {
    font-size: 17px;
  }
  .MuiFormLabel-root.MuiInputLabel-shrink {
    color: #000030;
  }
  .MuiInputBase-root {
    button.removeValue {
      display: none;
    }
  }

  &.showJazzIcon {
    .select-menu-item-text {
      margin-left: 27px;
    }

    img.node-jazz-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
    }
  }
`;

type Props = SelectMuiProps & {
  removeValue?: (value: number) => void;
  removeValueTooltip?: string;
  showJazzIcon?: boolean;
  values?: {
    value: string | number;
    name: string | number | null;
    apiEndpoint: string | null;
    jazzIcon?: string | null;
    disabled?: boolean;
  }[];
  native?: boolean;
};

const Select: React.FC<Props> = (props) => {
  console.log('props.values', props.values);
  return (
    <SFormControl
      style={props.style}
      className={`${props.showJazzIcon ? 'showJazzIcon' : ''}`}
    >
      <InputLabel id="select-small">{props.label}</InputLabel>
      <SelectMui
        labelId="select-small"
        id="select-small"
        size={props.size}
        value={props.value}
        onChange={props.onChange}
        label={props.label}
        disabled={props.disabled}
        native={props.native}
        MenuProps={{ disableScrollLock: true }}
      >
        {props.values &&
          props.values.map((elem, index) => {
            const jazzMd5apiEndpoint = elem.apiEndpoint && toHexMD5(elem.apiEndpoint);
            const icon = elem.jazzIcon
              ? generateBase64Jazz(elem.jazzIcon)
              : jazzMd5apiEndpoint && generateBase64Jazz(jazzMd5apiEndpoint);
            return (
              <MenuItem
                value={elem.value}
                disabled={elem.disabled}
                key={`${elem.value}_${elem.name}_${index}`}
                id={`${elem.value}_${elem.name}_${index}`}
                style={props.removeValue && { justifyContent: 'space-between' }}
              >
                {props.showJazzIcon && (
                  <img
                    className={`node-jazz-icon ${icon && 'node-jazz-icon-present'}`}
                    src={icon ?? '/assets/hopr_logo.svg'}
                    data-src={elem.jazzIcon ? elem.jazzIcon : jazzMd5apiEndpoint}
                  />
                )}
                <span className="select-menu-item-text">{elem.name}</span>
                {props.removeValue && (
                  <Tooltip title={props.removeValueTooltip}>
                    <IconButton
                      aria-label="delete"
                      className="removeValue"
                      onClick={(event) => {
                        event.stopPropagation();
                        props?.removeValue?.(Number(elem.value));
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </MenuItem>
            );
          })}
      </SelectMui>
    </SFormControl>
  );
};

export default Select;
