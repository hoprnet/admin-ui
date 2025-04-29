import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { actionsAsync } from '../../store/slices/node/actionsAsync';
import { exportToCsv } from '../../utils/helpers';

// HOPR Components
import Section from '../../future-hopr-lib-components/Section';
import { SubpageTitle } from '../../components/SubpageTitle';
import { CreateAliasModal } from '../../components/Modal/node//AddAliasModal';
import { OpenChannelModal } from '../../components/Modal/node/OpenChannelModal';
import { FundChannelModal } from '../../components/Modal/node/FundChannelModal';
import { SendMessageModal } from '../../components/Modal/node/SendMessageModal';
import IconButton from '../../future-hopr-lib-components/Button/IconButton';
import TablePro from '../../future-hopr-lib-components/Table/table-pro';
import ProgressBar from '../../future-hopr-lib-components/Progressbar';
import PeersInfo from '../../future-hopr-lib-components/PeerInfo';

//  Modals
import { PingModal } from '../../components/Modal/node/PingModal';
import { OpenSessionModal } from '../../components/Modal/node/OpenSessionModal';

//Mui
import GetAppIcon from '@mui/icons-material/GetApp';

function PeersPage() {
  const dispatch = useAppDispatch();
  const loginData = useAppSelector((store) => store.auth.loginData);
  const peers = useAppSelector((store) => store.node.peers.data);
  const peersFetching = useAppSelector((store) => store.node.peers.isFetching);
  const aliases = useAppSelector((store) => store.node.aliases.data);
  const aliasesFetching = useAppSelector((store) => store.node.aliases.isFetching);
  const nodeAddressToOutgoingChannelLink = useAppSelector((store) => store.node.links.nodeAddressToOutgoingChannel);
  const peerIdToAliasLink = useAppSelector((store) => store.node.links.peerIdToAlias);

  useEffect(() => {
    handleRefresh();
  }, [loginData, dispatch]);

  const handleRefresh = () => {
    if (!loginData.apiEndpoint) return;

    dispatch(
      actionsAsync.getPeersThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
      }),
    );
    dispatch(
      actionsAsync.getAliasesThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
      }),
    );
  };

  const getAliasByPeerId = (peerId: string): string => {
    if (aliases && peerId && peerIdToAliasLink[peerId]) return `${peerIdToAliasLink[peerId]} (${peerId})`;
    return peerId;
  };

  const handleExport = () => {
    if (peers?.connected) {
      exportToCsv(
        peers.connected.map((peer) => ({
          peerId: peer.peerId,
          nodeAddress: peer.peerAddress,
          quality: peer.quality,
          multiaddr: peer.multiaddr,
          heartbeats: peer.heartbeats,
          lastSeen: peer.lastSeen,
          backoff: peer.backoff,
          isNew: peer.isNew,
        })),
        'peers.csv',
      );
    }
  };

  const header = [
    {
      key: 'id',
      name: '#',
      maxWidth: '5px',
    },
    {
      key: 'node',
      name: 'Node',
      maxWidth: '300px',
    },
    {
      key: 'peerId',
      name: 'Peer Id',
      search: true,
      hidden: true,
    },
    {
      key: 'peerAddress',
      name: 'Node Address',
      search: true,
      hidden: true,
    },
    {
      key: 'lastSeen',
      name: 'Last seen',
      tooltip: true,
      maxWidth: '10px',
    },
    {
      key: 'quality',
      name: 'Quality',
      maxWidth: '10px',
    },
    {
      key: 'actions',
      name: 'Actions',
      search: false,
      width: '190px',
      maxWidth: '190px',
    },
  ];

  const peersWithAliases = (peers?.connected || []).filter(
    (peer) => aliases && peer.peerId && peerIdToAliasLink[peer.peerId],
  );
  const peersWithAliasesSorted = peersWithAliases.sort((a, b) => {
    if (getAliasByPeerId(b.peerId).toLowerCase() > getAliasByPeerId(a.peerId).toLowerCase()) {
      return -1;
    }
    if (getAliasByPeerId(b.peerId).toLowerCase() < getAliasByPeerId(a.peerId).toLowerCase()) {
      return 1;
    }
    return 0;
  });
  const peersWithoutAliases = (peers?.connected || []).filter(
    (peer) => aliases && peer.peerId && !peerIdToAliasLink[peer.peerId],
  );
  const peersWithoutAliasesSorted = peersWithoutAliases.sort((a, b) => {
    if (b.peerId > a.peerId) {
      return -1;
    }
    if (b.peerId < a.peerId) {
      return 1;
    }
    return 0;
  });

  const peersSorted = [...peersWithAliasesSorted, ...peersWithoutAliasesSorted];

  const parsedTableData = peersSorted.map((peer, index) => {
    const lastSeen =
      (peer.lastSeen as number) > 0
        ? new Date(peer.lastSeen)
            .toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short',
            })
            .replace(', ', '\n')
        : 'Not seen';

    return {
      id: index + 1,
      node: (
        <PeersInfo
          peerId={peer.peerId}
          nodeAddress={peer.peerAddress}
          shortenPeerIdIfAliasPresent
        />
      ),
      peerId: getAliasByPeerId(peer.peerId),
      peerAddress: peer.peerAddress,
      quality: <ProgressBar value={peer.quality} />,
      lastSeen: <span style={{ whiteSpace: 'break-spaces' }}>{lastSeen}</span>,
      actions: (
        <>
          <PingModal peerId={peer.peerId} />
          <CreateAliasModal
            handleRefresh={handleRefresh}
            peerId={peer.peerId}
          />
          {nodeAddressToOutgoingChannelLink[peer.peerAddress] ? (
            <FundChannelModal channelId={nodeAddressToOutgoingChannelLink[peer.peerAddress]} />
          ) : (
            <OpenChannelModal peerAddress={peer.peerAddress} />
          )}
          <OpenSessionModal peerId={peer.peerId} />
          <SendMessageModal peerId={peer.peerId} />
        </>
      ),
    };
  });

  return (
    <Section
      fullHeightMin
      yellow
    >
      <SubpageTitle
        title={`PEERS (${peers?.connected?.length || '-'})`}
        refreshFunction={handleRefresh}
        reloading={peersFetching || aliasesFetching}
        actions={
          <>
            <PingModal />
            <IconButton
              iconComponent={<GetAppIcon />}
              tooltipText={
                <span>
                  EXPORT
                  <br />
                  seen peers as a CSV
                </span>
              }
              disabled={!peers?.connected || Object.keys(peers.connected).length === 0}
              onClick={handleExport}
            />
          </>
        }
      />
      <TablePro
        data={parsedTableData}
        search={true}
        header={header}
        id={'node-peers-table'}
      />
    </Section>
  );
}

export default PeersPage;
