import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { actionsAsync } from '../../store/slices/node/actionsAsync';
import { useNavigate } from 'react-router-dom';
import { exportToCsv } from '../../utils/helpers';
import { HOPR_TOKEN_USED } from '../../../config';
import { sendNotification } from '../../hooks/useWatcher/notifications';
import { formatEther } from 'viem';
import { utils as hoprdUtils } from '@hoprnet/hopr-sdk';
const { sdkApiError } = hoprdUtils;

// HOPR Components
import Section from '../../future-hopr-lib-components/Section';
import { SubpageTitle } from '../../components/SubpageTitle';
import IconButton from '../../future-hopr-lib-components/Button/IconButton';
import TablePro from '../../future-hopr-lib-components/Table/table-pro';
import CloseChannelIcon from '../../future-hopr-lib-components/Icons/CloseChannel';
import PeersInfo from '../../future-hopr-lib-components/PeerInfo';

// Modals
import { PingModal } from '../../components/Modal/node/PingModal';
import { OpenChannelModal } from '../../components/Modal/node/OpenChannelModal';
import { FundChannelModal } from '../../components/Modal/node/FundChannelModal';
import { CreateAliasModal } from '../../components/Modal/node//AddAliasModal';
import { OpenSessionModal } from '../../components/Modal/node/OpenSessionModal';
//import { SendMessageModal } from '../../components/Modal/node/SendMessageModal.tsx_';

// Mui
import GetAppIcon from '@mui/icons-material/GetApp';
import { truncateEthereumAddress } from '../../utils/blockchain';

function ChannelsPage() {
  const dispatch = useAppDispatch();
  const channels = useAppSelector((store) => store.node.channels.data);
  const channelsIncoming = useAppSelector((store) => store.node.channels.data?.incoming);
  const channelsIncomingObject = useAppSelector((store) => store.node.channels.parsed.incoming);
  const channelsFetching = useAppSelector((store) => store.node.channels.isFetching);
  const aliases = useAppSelector((store) => store.node.aliases);
  const currentApiEndpoint = useAppSelector((store) => store.node.apiEndpoint);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const nodeAddressToPeerIdLink = useAppSelector((store) => store.node.links.nodeAddressToPeerId);
  const nodeAddressToOutgoingChannelLink = useAppSelector((store) => store.node.links.nodeAddressToOutgoingChannel);
  const tickets = useAppSelector((store) => store.node.metricsParsed.tickets.incoming);
  const peerIdToAliasLink = useAppSelector((store) => store.node.links.peerIdToAlias);
  const tabLabel = 'incoming';
  const channelsData = channels?.incoming;

  const handleRefresh = () => {
    if (!loginData.apiEndpoint) return;

    dispatch(
      actionsAsync.getChannelsThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
      }),
    );
    dispatch(
      actionsAsync.getPeersThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
      }),
    );
  };

  const getPeerIdFromPeerAddress = (nodeAddress: string): string => {
    const peerId = nodeAddressToPeerIdLink[nodeAddress];
    return peerId!;
  };

  const getAliasByPeerAddress = (nodeAddress: string): string => {
    const peerId = getPeerIdFromPeerAddress(nodeAddress);
    if (aliases && peerId && peerIdToAliasLink[peerId]) return `${peerIdToAliasLink[peerId]} (${nodeAddress})`;
    return nodeAddress;
  };

  const handleExport = () => {
    if (channelsData) {
      exportToCsv(
        Object.entries(channelsData).map(([, channel]) => ({
          channelId: channel.id,
          nodeAddress: channel.peerAddress,
          status: channel.status,
          dedicatedFunds: channel.balance,
        })),
        `${tabLabel}-channels.csv`,
      );
    }
  };

  const headerIncoming = [
    {
      key: 'id',
      name: '#',
    },
    {
      key: 'node',
      name: 'Node',
      maxWidth: '568px',
    },
    {
      key: 'peerAddress',
      name: 'Node Address',
      search: true,
      copy: true,
      hidden: true,
    },
    {
      key: 'peerId',
      name: 'Peer Id',
      search: true,
      hidden: true,
    },
    {
      key: 'status',
      name: 'Status',
      search: true,
      maxWidth: '368px',
      tooltip: true,
    },
    {
      key: 'funds',
      name: 'Dedicated Funds',
      maxWidth: '68px',
      tooltip: true,
    },
    // {
    //   key: 'tickets',
    //   name: 'Unredeemed',
    //   maxWidth: '130px',
    //   tooltipHeader: (
    //     <>
    //       Unredeemed value of tickets per channel in wxHOPR.
    //       <br />
    //       <br />
    //       Value is reset on node restart.
    //     </>
    //   ),
    //   tooltip: true,
    // },
    {
      key: 'actions',
      name: 'Actions',
      search: false,
      width: '225px',
      maxWidth: '225px',
    },
  ];

  const handleCloseChannel = (channelId: string) => {
    console.log('handleCloseChannel', channelId);
    dispatch(
      actionsAsync.closeChannelThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
        channelId: channelId,
        timeout: 120_000, //TODO: put those values as default to HOPRd SDK, average is 50s
      }),
    )
      .unwrap()
      .then(() => {
        handleRefresh();
      })
      .catch(async (e) => {
        const isCurrentApiEndpointTheSame = await dispatch(
          actionsAsync.isCurrentApiEndpointTheSame(loginData.apiEndpoint!),
        ).unwrap();
        if (!isCurrentApiEndpointTheSame) return;

        let errMsg = `Closing of incoming channel ${channelId} failed`;
        if (e instanceof sdkApiError && e.hoprdErrorPayload?.status)
          errMsg = errMsg + `.\n${e.hoprdErrorPayload.status}`;
        if (e instanceof sdkApiError && e.hoprdErrorPayload?.error) errMsg = errMsg + `.\n${e.hoprdErrorPayload.error}`;
        console.error(errMsg, e);
        sendNotification({
          notificationPayload: {
            source: 'node',
            name: errMsg,
            url: null,
            timeout: null,
          },
          toastPayload: { message: errMsg },
          dispatch,
        });
      });
  };

  const peersWithAliases = (channelsIncoming || []).filter(
    (peer) => aliases && peer.peerAddress && getAliasByPeerAddress(peer.peerAddress) !== peer.peerAddress,
  );
  const peersWithAliasesSorted = peersWithAliases.sort((a, b) => {
    if (getAliasByPeerAddress(b.peerAddress).toLowerCase() > getAliasByPeerAddress(a.peerAddress).toLowerCase()) {
      return -1;
    }
    if (getAliasByPeerAddress(b.peerAddress).toLowerCase() < getAliasByPeerAddress(a.peerAddress).toLowerCase()) {
      return 1;
    }
    return 0;
  });
  const peersWithoutAliases = (channelsIncoming || []).filter(
    (peer) => aliases && peer.peerAddress && getAliasByPeerAddress(peer.peerAddress) === peer.peerAddress,
  );
  const peersWithoutAliasesSorted = peersWithoutAliases.sort((a, b) => {
    if (b.peerAddress > a.peerAddress) {
      return -1;
    }
    if (b.peerAddress < a.peerAddress) {
      return 1;
    }
    return 0;
  });

  const peersSorted = [...peersWithAliasesSorted, ...peersWithoutAliasesSorted];

  const parsedTableData = peersSorted
    .map((channel, index) => {
      const id = channel.id;
      if (
        !channelsIncomingObject[id].peerAddress ||
        !channelsIncomingObject[id].balance ||
        !channelsIncomingObject[id].status
      )
        return;
      const outgoingChannelOpened = !!(
        channelsIncomingObject[id].peerAddress &&
        !!nodeAddressToOutgoingChannelLink[channelsIncomingObject[id].peerAddress as string]
      );
      const peerId = getPeerIdFromPeerAddress(channelsIncomingObject[id].peerAddress as string);
      const peerAddress = channelsIncomingObject[id].peerAddress;

      const totalTicketsPerChannel = `${formatEther(
        BigInt(tickets?.redeemed[id]?.value || '0') + BigInt(tickets?.unredeemed[id]?.value || '0'),
      )}`;
      const unredeemedTicketsPerChannel = `${formatEther(BigInt(tickets?.unredeemed[id]?.value || '0'))}`;
      const ticketsPerChannel = `${formatEther(BigInt(tickets?.redeemed[id]?.value || '0'))}/${totalTicketsPerChannel}`;

      return {
        id: (index + 1).toString(),
        key: id,
        node: (
          <PeersInfo
            peerId={peerId}
            nodeAddress={peerAddress}
            shortenPeerIdIfAliasPresent
          />
        ),
        peerAddress: getAliasByPeerAddress(peerAddress as string),
        status: channelsIncomingObject[id].status,
        funds: `${channelsIncomingObject[id].balance} ${HOPR_TOKEN_USED}`,
        tickets: unredeemedTicketsPerChannel,
        actions: (
          <>
            <PingModal
              address={peerAddress}
              disabled={!peerAddress}
              tooltip={
                !peerAddress ? (
                  <span>
                    DISABLED
                    <br />
                    Unable to find
                    <br />
                    node address
                  </span>
                ) : undefined
              }
            />
            {/* <CreateAliasModal
              handleRefresh={handleRefresh}
              peerId={peerId}
              disabled={!peerId}
              tooltip={
                !peerId ? (
                  <span>
                    DISABLED
                    <br />
                    Unable to find
                    <br />
                    peerId
                  </span>
                ) : undefined
              }
            /> */}
            {outgoingChannelOpened ? (
              <FundChannelModal channelId={id} />
            ) : (
              <OpenChannelModal peerAddress={channelsIncomingObject[id].peerAddress} />
            )}
            <IconButton
              iconComponent={<CloseChannelIcon />}
              pending={channelsIncomingObject[id]?.isClosing}
              tooltipText={
                <span>
                  CLOSE
                  <br />
                  incoming channel
                </span>
              }
              onClick={() => handleCloseChannel(id)}
            />
            <OpenSessionModal destination={peerAddress} />
            {/* <SendMessageModal
              peerId={peerId}
              disabled={!peerId}
              tooltip={
                !peerId ? (
                  <span>
                    DISABLED
                    <br />
                    Unable to find
                    <br />
                    peerId
                  </span>
                ) : undefined
              }
            /> */}
          </>
        ),
      };
    })
    .filter((elem) => elem !== undefined) as {
    id: string;
    key: string;
    peerAddress: string;
    status: 'Open' | 'PendingToClose' | 'Closed';
    tickets: string;
    funds: string;
    actions: JSX.Element;
  }[];

  return (
    <Section
      className="Channels--aliases"
      id="Channels--aliases"
      fullHeightMin
      yellow
    >
      <SubpageTitle
        title={`INCOMING CHANNELS (${channelsData ? channelsData.length : '-'})`}
        refreshFunction={handleRefresh}
        reloading={channelsFetching}
        actions={
          <>
            <IconButton
              iconComponent={<GetAppIcon />}
              tooltipText={
                <span>
                  EXPORT
                  <br />
                  {tabLabel} channels as a CSV
                </span>
              }
              disabled={!channelsData || Object.keys(channelsData).length === 0}
              onClick={handleExport}
            />
          </>
        }
      />
      <TablePro
        data={parsedTableData}
        id={'node-channels-in-table'}
        header={headerIncoming}
        search
        loading={parsedTableData.length === 0 && channelsFetching}
        orderByDefault="number"
      />
    </Section>
  );
}

export default ChannelsPage;
