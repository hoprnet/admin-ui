import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';

// HOPR Components
import SmallActionButton from '../../future-hopr-lib-components/Button/SmallActionButton';
import { generateBase64Jazz } from '../../utils/functions';

//Mui
import CopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';

interface Props {
  peerId?: string;
  nodeAddress?: string;
  shortenPeerId?: boolean;
  shortenPeerIdIfAliasPresent?: boolean;
}

const Container = styled.div`
  display: flex;
  align-items: center;
  .node-jazz-icon {
    height: 30px;
    width: 30px;
  }
`;

const PeersInfo: React.FC<Props> = (props) => {
  const { peerId, nodeAddress, ...rest } = props;
  const aliases = useAppSelector((store) => store.node.aliases.data);
  const peerIdToAliasLink = useAppSelector((store) => store.node.links.peerIdToAlias);

  const getAliasByPeerId = (peerId: string): string | JSX.Element => {
    const aliasPresent = aliases && peerId && peerIdToAliasLink[peerId];
    const shortPeerId = peerId && `${peerId.substring(0, 6)}...${peerId.substring(peerId.length - 8, peerId.length)}`;
    const displayPeerId =
      props.shortenPeerId || (props.shortenPeerIdIfAliasPresent && aliasPresent) ? shortPeerId : peerId;
    if (aliasPresent)
      return (
        <>
          <strong>{aliasPresent}</strong> ({displayPeerId})
        </>
      );
    return displayPeerId;
  };

  const noCopyPaste = !(
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  const icon = nodeAddress && generateBase64Jazz(nodeAddress);

  return (
    <Container>
      <img
        className={`node-jazz-icon node-jazz-icon-present`}
        src={icon || ''}
        data-src={nodeAddress}
      />
      <div>
        <span>{peerId && getAliasByPeerId(peerId)}</span>{' '}
        <SmallActionButton
          onClick={() => navigator.clipboard.writeText(peerId as string)}
          disabled={noCopyPaste}
          tooltip={noCopyPaste ? 'Clipboard not supported on HTTP' : 'Copy Peer Id'}
        >
          <CopyIcon />
        </SmallActionButton>
        <br />
        <span>{nodeAddress}</span>{' '}
        <SmallActionButton
          onClick={() => navigator.clipboard.writeText(nodeAddress as string)}
          disabled={noCopyPaste}
          tooltip={noCopyPaste ? 'Clipboard not supported on HTTP' : 'Copy Node Address'}
        >
          <CopyIcon />
        </SmallActionButton>
        <SmallActionButton tooltip={'Open in gnosisscan.io'}>
          <Link
            to={`https://gnosisscan.io/address/${nodeAddress}`}
            target="_blank"
          >
            <LaunchIcon />
          </Link>
        </SmallActionButton>
      </div>
    </Container>
  );
};

export default PeersInfo;
