import { useEffect } from 'react';
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
import PhoneDisabledIcon from '@mui/icons-material/PhoneDisabled';

function SessionsPage() {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector((store) => store.node.sessions.data) || [];
  const sessionsFetching = useAppSelector((store) => store.node.sessions.isFetching);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const apiEndpoint = loginData.apiEndpoint;
  const apiToken = loginData.apiToken;

  useEffect(() => {
    handleRefresh();
  }, [apiEndpoint, apiToken]);

  const handleRefresh = () => {
    if (!apiEndpoint) return;
    dispatch(
      actionsAsync.getSessionsThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      }),
    );
  };

  const handleExport = () => {
    if (sessions && sessions.length > 0) {
      exportToCsv(sessions, `sessions.csv`);
    }
  };

  const header = [
    {
      key: 'id',
      name: '#',
    },
    {
      key: 'destination',
      name: 'Destination',
      search: true,
      copy: true,
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
      key: 'mtu',
      name: 'MTU',
      search: true,
      copy: true,
    },
    {
      key: 'actions',
      name: 'Actions',
      search: false,
      width: '68px',
      maxWidth: '68px',
    },
  ];

  const handleCloseSession = (protocol: 'udp' | 'tcp', listeningIp: string, port: number) => {
    console.log('handleCloseSession', protocol, listeningIp, port);
    dispatch(
      actionsAsync.closeSessionThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
        protocol,
        listeningIp,
        port,
      }),
    )
      .unwrap()
      .catch(async (e) => {
        const isCurrentApiEndpointTheSame = await dispatch(
          actionsAsync.isCurrentApiEndpointTheSame(loginData.apiEndpoint!),
        ).unwrap();
        if (!isCurrentApiEndpointTheSame) return;

        let errMsg = `Closing of ${protocol} session to ${listeningIp}:${port} failed`;
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
      })
      .finally(() => {
        handleRefresh();
      });
  };

  const parsedTableData = sessions.map((session, index) => {
    return {
      id: (index + 1).toString(),
      key: session.target + index,
      destination: session.destination,
      ip: session.ip,
      port: session.port,
      protocol: session.protocol,
      target: session.target,
      mtu: session.hoprMtu,
      path: (
        <>
          <strong>Forward path:</strong>
          <br />
          <span style={{ whiteSpace: 'break-spaces' }}>
            {JSON.stringify(session.forwardPath)
              .replace(/{|}|\[|\]|"/g, '')
              .replace('IntermediatePath:', 'IntermediatePath:\n')
              .replace(/,/g, ' ')}
          </span>
          <br />
          <strong>Return path:</strong>
          <br />
          <span style={{ whiteSpace: 'break-spaces' }}>
            {JSON.stringify(session.forwardPath)
              .replace(/{|}|\[|\]|"/g, '')
              .replace('IntermediatePath:', 'IntermediatePath:\n')
              .replace(/,/g, ' ')}
          </span>
        </>
      ),
      actions: (
        <>
          <IconButton
            iconComponent={<PhoneDisabledIcon />}
            //  pending={channelsOutgoingObject[id]?.isClosing} //to be added when sessions will get targets
            tooltipText={
              <span>
                CLOSE
                <br />
                session
              </span>
            }
            onClick={() => handleCloseSession(session.protocol, session.ip, session.port)}
          />
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
                  sessions channels as a CSV
                </span>
              }
              disabled={!sessions || Object.keys(sessions).length === 0}
              onClick={handleExport}
            />
            <OpenSessionModal />
          </>
        }
      />
      <TablePro
        data={parsedTableData}
        id={'node-sessions-in-table'}
        header={header}
        search
        loading={parsedTableData.length === 0 && sessionsFetching}
        orderByDefault="number"
      />
    </Section>
  );
}

export default SessionsPage;
