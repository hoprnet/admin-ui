import { useEffect } from 'react';
import { createBrowserRouter, RouteObject, useSearchParams, useLocation } from 'react-router-dom';

// Store
import { useAppDispatch, useAppSelector } from './store';
import { authActions, authActionsAsync } from './store/slices/auth';
import { nodeActions, nodeActionsAsync } from './store/slices/node';

// Sections
import Section1 from './sections/selectNode';
import SectionLogs from './sections/logs';
import SectionWeb3 from './sections/web3';
import SectionSafe from './sections/safe';
import AliasesPage from './sections/aliases';
import InfoPage from './sections/info';
import MessagesPage from './sections/messages';
import PeersPage from './sections/peers';
import TicketsPage from './sections/tickets';
import ChannelsPage from './sections/channels';

// Layout
import Layout from './future-hopr-lib-components/Layout';
import ConnectWeb3 from './components/ConnectWeb3';
import ConnectNode from './components/ConnectNode';
import NotificationBar from './components/NotificationBar';

// Icons
import CableIcon from '@mui/icons-material/Cable';
import InfoIcon from '@mui/icons-material/Info';
import LanIcon from '@mui/icons-material/Lan';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import SettingsIcon from '@mui/icons-material/Settings';
import TerminalIcon from '@mui/icons-material/Terminal';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import MailIcon from '@mui/icons-material/Mail';
import HubIcon from '@mui/icons-material/Hub';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LockIcon from '@mui/icons-material/Lock';
import ContactPhone from '@mui/icons-material/ContactPhone';

export const applicationMap = [
  // {
  //   path: '/',
  //   element: <SectionInfo/>,
  //   drawer: false,
  // },
  {
    groupName: 'Node',
    path: 'node',
    items: [
      {
        name: 'Connect',
        path: 'connect',
        icon: <CableIcon />,
        element: <Section1 />,
      },
      {
        name: 'Info',
        path: 'info',
        icon: <InfoIcon />,
        element: <InfoPage />,
        loginNeeded: 'node',
      },
      {
        name: 'Logs',
        path: 'logs',
        icon: <TerminalIcon />,
        element: <SectionLogs />,
        loginNeeded: 'node',
      },
      {
        name: 'Tickets',
        path: 'tickets',
        icon: <ConfirmationNumberIcon />,
        element: <TicketsPage />,
        loginNeeded: 'node',
      },
      {
        name: 'Configuration',
        path: 'configuration',
        icon: <SettingsIcon />,
        loginNeeded: 'node',
      },
    ],
  },
  {
    groupName: 'Networking',
    path: 'networking',
    items: [
      {
        name: 'Ping',
        path: 'ping',
        icon: <RssFeedIcon />,
        loginNeeded: 'node',
      },
      {
        name: 'Peers',
        path: 'peers',
        icon: <LanIcon />,
        element: <PeersPage />,
        loginNeeded: 'node',
      },
      {
        name: 'Aliases',
        path: 'aliases',
        icon: <ContactPhone />,
        element: <AliasesPage />,
        loginNeeded: 'node',
      },
      {
        name: 'Messages',
        path: 'messages',
        icon: <MailIcon />,
        element: <MessagesPage />,
        loginNeeded: 'node',
      },
      {
        name: 'Channels',
        path: 'channels',
        icon: <HubIcon />,
        element: <ChannelsPage />,
        loginNeeded: 'node',
      },
    ],
  },
  {
    groupName: 'DEVELOP',
    path: 'develop',
    items: [
      {
        name: 'Web3',
        path: 'web3',
        icon: <AccountBalanceWalletIcon />,
        element: <SectionWeb3 />,
        loginNeeded: 'web3',
      },
      {
        name: 'Safe',
        path: 'safe',
        icon: <LockIcon />,
        element: <SectionSafe />,
        loginNeeded: 'web3',
      },
    ],
  },
];

const LayoutEnhanced = () => {
  const dispatch = useAppDispatch();
  const nodeConnected = useAppSelector((store) => store.auth.status.connected);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const [searchParams, set_searchParams] = useSearchParams();
  const apiEndpoint = searchParams.get('apiEndpoint');
  const apiToken = searchParams.get('apiToken');

  useEffect(() => {
    if (!(apiEndpoint && apiToken)) return;
    if (loginData.apiEndpoint === apiEndpoint && loginData.apiToken === apiToken) return;
    dispatch(
      authActions.useNodeData({
        apiEndpoint,
        apiToken,
      }),
    );
    dispatch(
      authActionsAsync.loginThunk({
        apiEndpoint,
        apiToken,
      }),
    );
    dispatch(
      nodeActionsAsync.getInfoThunk({
        apiToken,
        apiEndpoint,
      }),
    );
    dispatch(
      nodeActionsAsync.getAddressesThunk({
        apiToken,
        apiEndpoint,
      }),
    );
  }, [apiEndpoint, apiToken]);

  return (
    <Layout
      drawer
      webapp
      drawerItems={applicationMap}
      drawerLoginState={{
        node: nodeConnected,
        web3: true,
      }}
      itemsNavbarRight={
        <>
          <NotificationBar />
          <ConnectWeb3 />
          <ConnectNode />
        </>
      }
    />
  );
};

var routes = [
  {
    path: '/',
    element: <LayoutEnhanced />,
    children: [] as RouteObject[],
  },
];

applicationMap.map((groups) => {
  // if(!groups.items) {
  //   routes[0].children.push({ path: groups.path, element: groups.element});
  // } else {
  groups.items.map((item) => {
    if (item.path && item.element)
      routes[0].children.push({
        path: groups.path + '/' + item.path,
        element: item.element,
      });
  });
  //  }
});

console.log('routes', routes);
const router = createBrowserRouter(routes);

export default router;
export type ApplicationMapType = typeof applicationMap;
