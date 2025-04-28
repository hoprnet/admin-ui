import { useEffect } from 'react';
import {
  createBrowserRouter,
  RouteObject,
  useSearchParams,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { environment } from '../config';
import { parseAndFormatUrl } from './utils/parseAndFormatUrl';

// Store
import { useAppDispatch, useAppSelector } from './store';
import { authActions, authActionsAsync } from './store/slices/auth';
import { nodeActions, nodeActionsAsync } from './store/slices/node';

// Sections
import NodeLandingPage from './pages/node/landingPage';
import AliasesPage from './pages/node/aliases';
import InfoPage from './pages/node/info';
import MessagesPage from './pages/node/messages';
import PeersPage from './pages/node/peers';
import TicketsPage from './pages/node/tickets';
import ChannelsPageIncoming from './pages/node/channelsIncoming';
import ChannelsPageOutgoing from './pages/node/channelsOutgoing';
import MetricsPage from './pages/node/metrics';
import ConfigurationPage from './pages/node/configuration';
import SessionsPage from './pages/node/sessions'

// Layout
import Layout from './future-hopr-lib-components/Layout';
import ConnectNode from './components/ConnectNode';
import NotificationBar from './components/NotificationBar';
import InfoBar from './components/InfoBar';

// Icons
import InfoIcon from '@mui/icons-material/Info';
import LanIcon from '@mui/icons-material/Lan';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import SettingsIcon from '@mui/icons-material/Settings';
import MailIcon from '@mui/icons-material/Mail';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LockIcon from '@mui/icons-material/Lock';
import ContactPhone from '@mui/icons-material/ContactPhone';
import SavingsIcon from '@mui/icons-material/Savings';
import NodeIcon from '@mui/icons-material/Router';
import NetworkingIcon from '@mui/icons-material/Diversity3';
import DevelopIcon from '@mui/icons-material/Code';
import BarChartIcon from '@mui/icons-material/BarChart';
import LinkIcon from '@mui/icons-material/Link';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import TelegramIcon from '@mui/icons-material/Telegram';
import IncomingChannelsIcon from './future-hopr-lib-components/Icons/channelsIn';
import OutgoingChannelsIcon from './future-hopr-lib-components/Icons/channelsOut';
import TermsOfService from './pages/TermsOfService';
import PrivacyNotice from './pages/PrivacyNotice';
import SettingsPhoneIcon from '@mui/icons-material/SettingsPhone';

import { trackGoal } from 'fathom-client';

export type ApplicationMapType = {
  groupName: string;
  path: string;
  icon: JSX.Element;
  mobileOnly?: boolean | null;
  items: {
    name?: string;
    path: string;
    overwritePath?: string;
    icon?: JSX.Element;
    element?: JSX.Element;
    inDrawer?: boolean | null;
    loginNeeded?: 'node' | 'web3' | 'safe';
    onClick?: () => void;
    mobileOnly?: boolean | null;
    numberKey?: string;
    fetchingKey?: string;
  }[];
}[];

export const applicationMapNode: ApplicationMapType = [
  {
    groupName: 'NODE',
    path: 'node',
    icon: <NodeIcon />,
    items: [
      {
        name: 'INFO',
        path: 'info',
        icon: <InfoIcon />,
        element: <InfoPage />,
        loginNeeded: 'node',
      },
      {
        name: 'TICKETS',
        path: 'tickets',
        icon: <ConfirmationNumberIcon />,
        element: <TicketsPage />,
        loginNeeded: 'node',
      },
      {
        name: 'METRICS',
        path: 'metrics',
        icon: <BarChartIcon />,
        element: <MetricsPage />,
        loginNeeded: 'node',
      },
      {
        name: 'CONFIGURATION',
        path: 'configuration',
        icon: <SettingsIcon />,
        element: <ConfigurationPage />,
        loginNeeded: 'node',
      },
    ],
  },
  {
    groupName: 'NETWORKING',
    path: 'networking',
    icon: <NetworkingIcon />,
    items: [
      {
        name: 'PEERS',
        path: 'peers',
        icon: <LanIcon />,
        element: <PeersPage />,
        loginNeeded: 'node',
        numberKey: 'numberOfPeers',
        fetchingKey: 'fetchingPeers',
      },
      {
        name: 'ALIASES',
        path: 'aliases',
        icon: <ContactPhone />,
        element: <AliasesPage />,
        loginNeeded: 'node',
        numberKey: 'numberOfAliases',
      },
      {
        name: 'MESSAGES',
        path: 'messages',
        icon: <MailIcon />,
        element: <MessagesPage />,
        loginNeeded: 'node',
        numberKey: 'numberOfMessagesReceived',
      },
      {
        name: 'CHANNELS: IN',
        path: 'channels-INCOMING',
        icon: <IncomingChannelsIcon />,
        element: <ChannelsPageIncoming />,
        loginNeeded: 'node',
        numberKey: 'numberOfChannelsIn',
        fetchingKey: 'fetchingChannels',
      },
      {
        name: 'CHANNELS: OUT',
        path: 'channels-OUTGOING',
        icon: <OutgoingChannelsIcon />,
        element: <ChannelsPageOutgoing />,
        loginNeeded: 'node',
        numberKey: 'numberOfChannelsOut',
        fetchingKey: 'fetchingChannels',
      },
      {
        name: 'SESSIONS',
        path: 'sessions',
        icon: <SettingsPhoneIcon />,
        element: <SessionsPage />,
        loginNeeded: 'node',
        numberKey: 'numberOfSessions',
        fetchingKey: 'fetchingSessions',
      },
    ],
  },
  {
    groupName: 'LINKS',
    path: 'links',
    icon: <LinkIcon />,
    items: [
      {
        name: 'Staking Hub',
        path: 'https://hub.hoprnet.org/',
        icon: <SavingsIcon />,
      },
      {
        name: 'Docs',
        path: 'https://docs.hoprnet.org/',
        icon: <LibraryBooksIcon />,
      },
      {
        name: 'Telegram',
        path: 'https://t.me/hoprnet',
        icon: <TelegramIcon />,
      },
    ],
  },
];

export const applicationMapDev: ApplicationMapType = [
  {
    groupName: 'DEVELOP / Steps',
    path: 'steps',
    icon: <DevelopIcon />,
    items: [],
  },
];

function createApplicationMap() {
  const temp: ApplicationMapType = [];
  if (environment === 'dev' || environment === 'node') applicationMapNode.map((elem) => temp.push(elem));
  if (environment === 'dev') applicationMapDev.map((elem) => temp.push(elem));
  return temp;
}

export const applicationMap: ApplicationMapType = createApplicationMap();

const LayoutEnhanced = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const nodeConnected = useAppSelector((store) => store.auth.status.connected);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const [searchParams] = useSearchParams();
  const apiEndpoint = searchParams.get('apiEndpoint');
  const apiToken = searchParams.get('apiToken');

  const numberOfPeers = useAppSelector((store) => store.node.peers.data?.connected.length);
  const fetchingPeers = useAppSelector((store) => store.node.peers.isFetching);
  const numberOfAliases = useAppSelector(
    (store) => store.node.aliases?.data && Object.keys(store.node.aliases?.data).length,
  );
  const fetchingAliases = useAppSelector((store) => store.node.aliases.isFetching);
  const numberOfMessagesReceived = useAppSelector((store) => store.node.messages.data.length);
  const numberOfChannelsIn = useAppSelector((store) => store.node.channels.data?.incoming.length);
  const numberOfChannelsOut = useAppSelector((store) => store.node.channels.data?.outgoing.length);
  const fetchingChannels = useAppSelector((store) => store.node.channels.isFetching);
  const numberOfSessions = useAppSelector((store) => store.node.sessions.data?.length);
  const fetchingSessions = useAppSelector((store) => store.node.sessions.isFetching);

  const numberForDrawer = {
    numberOfPeers,
    numberOfAliases,
    numberOfMessagesReceived,
    numberOfChannelsIn,
    numberOfChannelsOut,
    numberOfSessions
  };

  const drawerNumbersLoading = {
    fetchingPeers,
    fetchingAliases,
    fetchingChannels,
    fetchingSessions,
  };

  useEffect(() => {
    // console.log('useEffect(()', apiEndpoint, apiToken);
    if (!apiEndpoint) return;
    if (loginData.apiEndpoint === apiEndpoint && loginData.apiToken === apiToken) return;
    const formattedApiEndpoint = parseAndFormatUrl(apiEndpoint);
    console.log('Node Admin login from url', formattedApiEndpoint);
    dispatch(
      authActions.useNodeData({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      }),
    );
    dispatch(nodeActions.setApiEndpoint({ apiEndpoint: formattedApiEndpoint }));
    const useNode = async () => {
      try {
        //  console.log('Node Admin login from router');
        const loginInfo = await dispatch(
          authActionsAsync.loginThunk({
            apiEndpoint,
            apiToken: apiToken ? apiToken : '',
          }),
        ).unwrap();
        if (loginInfo) {
          // We do this after the loginInfo to make sure the login from url was successful
          trackGoal('Y641EPNA', 1); // LOGIN_TO_NODE_BY_URL
          dispatch(
            nodeActionsAsync.isNodeReadyThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getInfoThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getAddressesThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getAliasesThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getPeersThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getBalancesThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getMessagesThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
              firstLoad: true,
            }),
          );
          dispatch(
            nodeActionsAsync.getChannelsThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getTicketStatisticsThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getPrometheusMetricsThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getConfigurationThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getTicketPriceThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getMinimumNetworkProbabilityThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          );
          dispatch(
            nodeActionsAsync.getSessionsThunk({
              apiEndpoint,
              apiToken: apiToken ? apiToken : '',
            }),
          )
        }
      } catch (e) {
        trackGoal('ZUIBL4M8', 1); // FAILED_CONNECT_TO_NODE_BY_URL
        // error is handled on redux
      }
    };
    useNode();
  }, [apiEndpoint, apiToken]);

  const showInfoBar = () => {
    return nodeConnected;
  };

  return (
    <Layout
      drawer
      webapp
      drawerItems={applicationMap}
      drawerFunctionItems={undefined}
      drawerNumbers={numberForDrawer}
      drawerNumbersLoading={drawerNumbersLoading}
      drawerLoginState={{ node: nodeConnected }}
      className={environment}
      drawerType={undefined}
      itemsNavbarRight={
        <>
          {(environment === 'dev' || environment === 'node') && <NotificationBar />}
          {(environment === 'dev' || environment === 'node') && <ConnectNode />}
        </>
      }
      drawerRight={showInfoBar() && <InfoBar />}
    />
  );
};

var routes = [
  {
    path: '/',
    element: <LayoutEnhanced />,
    children: [] as RouteObject[],
  },
  {
    path: '*',
    element: (
      <Navigate
        to="/"
        replace
      />
    ),
    children: [] as RouteObject[],
  },
];

applicationMap.map((groups) => {
  groups.items.map((item) => {
    if (environment === 'node') {
      routes[0].children.push({
        path: '/',
        element: <NodeLandingPage />,
      });
    }
    if (item.path && item.element) {
      routes[0].children.push({
        path: item.overwritePath ? item.overwritePath : groups.path + '/' + item.path,
        element: item.element,
      });
    }
  });
});

routes[0].children.push({
  path: '/tos',
  element: <TermsOfService />,
});
routes[0].children.push({
  path: '/privacy-notice',
  element: <PrivacyNotice />,
});

const router = createBrowserRouter(routes);

export default router;
