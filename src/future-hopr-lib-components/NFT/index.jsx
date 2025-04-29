import React, { useState } from 'react';
import styled from '@emotion/styled';

import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

import Button from '../Button';
import NftImageInteractive from './nftImageInteractive';

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-content: space-evenly;
  border: 1px solid rgb(204, 204, 204);
  padding: 4px;
  gap: 2px;
  border-radius: 8px;
  img.nft-image {
    width: 230px;
    margin: auto;
    max-width: 100%;
    height: 325px;
    object-fit: contain;
    @media (max-width: 820px) {
      width: 200px;
      height: 282px;
    }
  }
  .btn-hopr--v2 {
    width: calc(100% - 16px);
    margin: 4px 8px;
  }
  table {
    border-bottom: unset;
  }
  .count {
    top: -6px;
    right: -6px;
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 30px;
    background: red;
    box-shadow: 0px 4px 6px rgb(0 0 0 / 50%);
    text-align: center;
    color: white;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &.ignored {
    img {
      filter: opacity(0.4);
    }
  }
`;

const CustomWidthTooltip = styled(({ className, ...props }) => (
  <Tooltip
    {...props}
    classes={{ popper: className }}
  />
))({
  [`
        color: white;
        & .${tooltipClasses.tooltip}`]: { maxWidth: 200 },
});

export default function Nft(props) {
  const [disableButton, set_disableButton] = useState(false);

  async function handleLockNFT() {
    set_disableButton(true);
    await props.handleLockNFT(props.id);
    set_disableButton(false);
  }

  return (
    <Container className={[props.ignored ? 'ignored' : ''].join(' ')}>
      {/* <img src={props.image} className="nft-image" /> */}
      <NftImageInteractive
        image={props.image}
        nft={props.nft}
        ignored={props.ignored}
      />
      <div className="css-ndd2wf">
        <div className="css-1gdwl90">
          {!props.locked &&
            (props.willBeIgnoredInStaking ? (
              <CustomWidthTooltip
                title="This NFT will be ignored after locking, becuase you already have NFT of the same type with the same or better APR boost locked."
                placement="top"
                //    arrow
              >
                <Button
                  onClick={handleLockNFT}
                  disabled={disableButton}
                  fade={props.willBeIgnoredInStaking}
                >
                  Lock NFT
                </Button>
              </CustomWidthTooltip>
            ) : (
              <Button
                onClick={handleLockNFT}
                disabled={disableButton}
              >
                Lock NFT
              </Button>
            ))}
        </div>
      </div>
      {props.count > 1 && <div className="count">{props.count}</div>}
    </Container>
  );
}
