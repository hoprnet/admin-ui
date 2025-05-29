import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { actionsAsync } from '../../store/slices/node/actionsAsync';
import { useNavigate } from 'react-router-dom';
import { exportToCsv } from '../../utils/helpers';
import { formatEther, parseEther, parseGwei } from 'viem';
import { sendNotification } from '../../hooks/useWatcher/notifications';
import { HOPR_TOKEN_USED } from '../../../config';
import { utils as hoprdUtils } from '@hoprnet/hopr-sdk';
const { sdkApiError } = hoprdUtils;

// HOPR Components
import Section from '../../future-hopr-lib-components/Section';
import { SubpageTitle } from '../../components/SubpageTitle';
import IconButton from '../../future-hopr-lib-components/Button/IconButton';
import CloseChannelIcon from '../../future-hopr-lib-components/Icons/CloseChannel';
import TablePro from '../../future-hopr-lib-components/Table/table-pro';
import PeersInfo from '../../future-hopr-lib-components/PeerInfo';

// Modals
import { OpenMultipleChannelsModal } from '../../components/Modal/node/OpenMultipleChannelsModal';
import { PingModal } from '../../components/Modal/node/PingModal';
import { OpenChannelModal } from '../../components/Modal/node/OpenChannelModal';
import { FundChannelModal } from '../../components/Modal/node/FundChannelModal';
import { OpenSessionModal } from '../../components/Modal/node/OpenSessionModal';
import { CreateAliasModal } from '../../components/Modal/node//AddAliasModal';
//import { SendMessageModal } from '../../components/Modal/node/SendMessageModal.tsx_';

// Mui
import GetAppIcon from '@mui/icons-material/GetApp';

function ChannelsPage() {
  const dispatch = useAppDispatch();
  const channels = useAppSelector((store) => store.node.channels.data);
  const channelsOutgoingObject = useAppSelector((store) => store.node.channels.parsed.outgoing);
  const channelsOutgoing = useAppSelector((store) => store.node.channels.data?.outgoing);
  const channelsFetching = useAppSelector((store) => store.node.channels.isFetching);
  const aliases = useAppSelector((store) => store.node.aliases);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const currentApiEndpoint = useAppSelector((store) => store.node.apiEndpoint);
  const nodeAddressToPeerIdLink = useAppSelector((store) => store.node.links.nodeAddressToPeerId);
  const tabLabel = 'outgoing';
  const channelsData = channels?.outgoing;

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

  const getAliasByPeerAddress = (address: string): string => {
    if (aliases && address && aliases[address]) return `${aliases[address]} (${address})`;
    return address;
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

  const handleCloseChannels = (channelId: string) => {
    dispatch(
      actionsAsync.closeChannelThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
        channelId: channelId,
        timeout: 5 * 60_000,
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

        if (
          e instanceof sdkApiError &&
          e.hoprdErrorPayload?.error?.includes('channel closure time has not elapsed yet, remaining')
        ) {
          const errMsg = `Closing of outgoing channel ${channelId} halted. C${e.hoprdErrorPayload?.error.substring(1)}`;
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
          return;
        }

        let errMsg = `Closing of outgoing channel ${channelId} failed`;
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

  const header = [
    {
      key: 'id',
      name: '#',
    },
    {
      key: 'node',
      name: 'Node',
      maxWidth: '500px',
    },
    {
      key: 'peerAddress',
      name: 'Node Address',
      search: true,
      hidden: true,
    },
    {
      key: 'status',
      name: 'Status',
      search: true,
      tooltip: true,
      maxWidth: '80px',
    },
    {
      key: 'funds',
      name: 'Dedicated Funds',
      tooltip: true,
      maxWidth: '45px',
    },
    {
      key: 'actions',
      name: 'Actions',
      search: false,
      width: '225px',
      maxWidth: '225px',
    },
  ];

  const peersWithAliases = (channelsOutgoing || []).filter(
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
  const peersWithoutAliases = (channelsOutgoing || []).filter(
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
        !channelsOutgoingObject[id].peerAddress ||
        !channelsOutgoingObject[id].balance ||
        !channelsOutgoingObject[id].status
      )
        return;

      const peerAddress = channelsOutgoingObject[id].peerAddress;
      if (!peerAddress) return;

      return {
        id: (index + 1).toString(),
        key: id,
        node: (
          <PeersInfo
            nodeAddress={peerAddress}
          />
        ),
        peerAddress: getAliasByPeerAddress(peerAddress as string),
        status: channelsOutgoingObject[id].status as string,
        funds: `${channelsOutgoingObject[id].balance} ${HOPR_TOKEN_USED}`,
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
            <FundChannelModal channelId={id} />
            <IconButton
              iconComponent={<CloseChannelIcon />}
              pending={channelsOutgoingObject[id]?.isClosing}
              tooltipText={
                <span>
                  CLOSE
                  <br />
                  outgoing channel
                </span>
              }
              onClick={() => handleCloseChannels(id)}
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
        title={`OUTGOING CHANNELS (${channelsData ? channelsData.length : '-'})`}
        refreshFunction={handleRefresh}
        reloading={channelsFetching}
        actions={
          <>
            <OpenChannelModal />
            <OpenMultipleChannelsModal />
            <FundChannelModal />
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
        id={'node-channels-out-table'}
        header={header}
        search
        loading={parsedTableData.length === 0 && channelsFetching}
        orderByDefault="number"
      />
    </Section>
  );
}

export default ChannelsPage;
