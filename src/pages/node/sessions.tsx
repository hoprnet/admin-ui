import { useAppDispatch, useAppSelector } from '../../store';
import { actionsAsync } from '../../store/slices/node/actionsAsync';
import { exportToCsv } from '../../utils/helpers';
import { sendNotification } from '../../hooks/useWatcher/notifications';
import { utils as hoprdUtils } from '@hoprnet/hopr-sdk';
const { sdkApiError } = hoprdUtils;

// HOPR Components
import Section from '../../future-hopr-lib-components/Section';
import { SubpageTitle } from '../../components/SubpageTitle';
import IconButton from '../../future-hopr-lib-components/Button/IconButton';
import TablePro from '../../future-hopr-lib-components/Table/table-pro';

// Modals
import { OpenSessionModal } from '../../components/Modal/node/OpenSessionModal';

// Mui
import GetAppIcon from '@mui/icons-material/GetApp';
import { useEffect } from 'react';

function ChannelsPage() {
  const dispatch = useAppDispatch();
  const channels = useAppSelector((store) => store.node.channels.data);
  const sessions = useAppSelector((store) => store.node.sessions.data) || [];
  const sessionsFetching = useAppSelector((store) => store.node.sessions.isFetching);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const apiEndpoint = loginData.apiEndpoint;
  const apiToken = loginData.apiToken;
  const tabLabel = 'incoming';
  const channelsData = channels?.incoming;

  useEffect(() => {
    handleRefresh();
  }, [apiEndpoint, apiToken]);

  const handleRefresh = () => {
    if (!apiEndpoint) return;
    dispatch(
      actionsAsync.getSessionsThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : ''
      }),
    )
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
      key: 'ip',
      name: 'IP',
      search: true,
      copy: true,
    },
    {
      key: 'port',
      name: 'Port',
      search: true,
      copy: true,
    },
    {
      key: 'protocol',
      name: 'Protocol',
      search: true,
      copy: true,
    },
    {
      key: 'target',
      name: 'Target',
      search: true,
      copy: true,
    },
    {
      key: 'path',
      name: 'Path',
      search: true,
      copy: true,
    },
    {
      key: 'actions',
      name: 'Actions',
      search: false,
      width: '188px',
      maxWidth: '188px',
    },
  ];

  const handleCloseSession = (channelId: string) => {
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

  const parsedTableData = sessions
    .map((session, index) => {
      return {
        id: (index + 1).toString(),
        key: session.target + index,
        ip: session.ip,
        port: session.port,
        protocol: session.protocol,
        target: session.target,
        path: JSON.stringify(session.path).replace(/{|}|"/g, '').replaceAll(/,/g, ', '),
        actions: (
          <>
          </>
        ),
      };
    });

  return (
    <Section
      className="Channels--aliases"
      id="Channels--aliases"
      fullHeightMin
      yellow
    >
      <SubpageTitle
        title={`SESSIONS (${sessions ? sessions.length : '-'})`}
        refreshFunction={handleRefresh}
        reloading={sessionsFetching}
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
              disabled={!sessions || Object.keys(sessions).length === 0}
              onClick={handleExport}
            />
            <OpenSessionModal/>
          </>
        }
      />
      <TablePro
        data={parsedTableData}
        id={'node-channels-in-table'}
        header={headerIncoming}
        search
        loading={parsedTableData.length === 0 && sessionsFetching}
        orderByDefault="number"
      />
    </Section>
  );
}

export default ChannelsPage;
