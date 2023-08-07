import { useEffect } from 'react';
import { createBrowserRouter, RouteObject, useSearchParams } from 'react-router-dom';
import { environment } from '../config';

// Store
import { useAppDispatch, useAppSelector } from './store';
import { authActions, authActionsAsync } from './store/slices/auth';
import { nodeActions, nodeActionsAsync } from './store/slices/node';

// Sections
import Section1 from './components/ConnectNode/modal';
import SectionLogs from './sections/node/logs';
import SectionWeb3 from './sections/web3';
import SectionSafe from './sections/safe';
import AliasesPage from './sections/node/aliases';
import InfoPage from './sections/node/info';
import MessagesPage from './sections/node/messages';
import PeersPage from './sections/node/peers';
import TicketsPage from './sections/node/tickets';
import ChannelsPage from './sections/node/channels';
import MetricsPage from './sections/node/metrics';
import SafeStakingPage from './sections/safeStaking';
import SettingsPage from './sections/node/settings';
import SafeQueue from './sections/safePendingTransactions';
import AddNode from './steps/installNode/addNode';
import SelectNodeType from './steps/installNode/selectNodeType';
import WrapperPage from './sections/wrapper';
import XdaiToNodePage from './steps/xdaiToNode';
import SafeTransactionHistoryPage from './sections/safeTransactionHistory';
import StakingScreen from './sections/staking-screen';
import SafeWithdraw from './sections/safeWithdraw';

// Layout
import Layout from './future-hopr-lib-components/Layout';
import ConnectWeb3 from './components/ConnectWeb3';
import ConnectNode from './components/ConnectNode';
import NotificationBar from './components/NotificationBar';
import InfoBar from './components/InfoBar';

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
import SavingsIcon from '@mui/icons-material/Savings';
import NodeIcon from '@mui/icons-material/Router';
import NetworkingIcon from '@mui/icons-material/Diversity3';
import DevelopIcon from '@mui/icons-material/Code';
import PingPage from './sections/node/ping';
import BarChartIcon from '@mui/icons-material/BarChart';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import AddBoxIcon from '@mui/icons-material/AddBox';
import DockerInstallation from './steps/installNode/dockerInstallation';
import NodeAddress from './steps/installNode/nodeAddress';
import PaidIcon from '@mui/icons-material/Paid';
import ConnectSafe from './components/ConnectSafe';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SafeOnboarding from './steps/safeOnboarding';
import NoNodeAdded from './sections/noNodeAdded';
import SafeSettings from './sections/safeSettings';
import StakingLandingPage from './sections/stakingLandingPage';
import NodeAdded from './sections/nodeAdded';
import WalletIcon from '@mui/icons-material/Wallet';

export type ApplicationMapType = {
  groupName: string;
  path: string;
  icon: JSX.Element;
  items: {
    name: string;
    path: string;
    icon: JSX.Element;
    element?: JSX.Element;
    loginNeeded?: 'node' | 'web3';
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
        name: 'LOGS',
        path: 'logs',
        icon: <TerminalIcon />,
        element: <SectionLogs />,
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
        element: <SettingsPage />,
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
        name: 'PING',
        path: 'ping',
        icon: <RssFeedIcon />,
        element: <PingPage />,
        loginNeeded: 'node',
      },
      {
        name: 'PEERS',
        path: 'peers',
        icon: <LanIcon />,
        element: <PeersPage />,
        loginNeeded: 'node',
      },
      {
        name: 'ALIASES',
        path: 'aliases',
        icon: <ContactPhone />,
        element: <AliasesPage />,
        loginNeeded: 'node',
      },
      {
        name: 'MESSAGES',
        path: 'messages',
        icon: <MailIcon />,
        element: <MessagesPage />,
        loginNeeded: 'node',
      },
      {
        name: 'CHANNELS',
        path: 'channels',
        icon: <HubIcon />,
        element: <ChannelsPage />,
        loginNeeded: 'node',
      },
    ],
  },
];

export const applicationMapWeb3: ApplicationMapType = [
  {
    groupName: 'Staking Hub',
    path: 'hub',
    icon: <DevelopIcon />,
    items: [
      {
        name: 'Web3',
        path: 'web3',
        icon: <AccountBalanceWalletIcon />,
        element: <SectionWeb3 />,
        loginNeeded: 'web3',
      },
      {
        name: 'Staking screen',
        path: 'staking-screen',
        icon: <SavingsIcon />,
        element: <StakingScreen />,
        loginNeeded: 'web3',
      },
      {
        name: 'No node added',
        path: 'no-node',
        icon: <SavingsIcon />,
        element: <NoNodeAdded />,
        loginNeeded: 'web3',
      },
      {
        name: 'Node added',
        path: 'node-added',
        icon: <SavingsIcon />,
        element: <NodeAdded />,
        loginNeeded: 'web3',
      },
      {
        name: 'Safe',
        path: 'safe',
        icon: <LockIcon />,
        element: <SectionSafe />,
        loginNeeded: 'web3',
      },
      {
        name: 'Pending transactions',
        path: 'safe/pending-transactions',
        icon: <SwapVertIcon />,
        element: <SafeQueue />,
        loginNeeded: 'web3',
      },
      {
        name: 'Safe/Staking',
        path: 'safe/staking',
        icon: <SavingsIcon />,
        element: <SafeStakingPage />,
        loginNeeded: 'web3',
      },
      {
        name: 'Staking Hub',
        path: 'staking-hub-landing',
        icon: <SavingsIcon />,
        element: <StakingLandingPage />,
        loginNeeded: 'web3',
      },
      {
        name: 'Transaction history',
        path: 'safe/transaction-history',
        icon: <ReceiptIcon />,
        element: <SafeTransactionHistoryPage />,
        loginNeeded: 'web3',
      },
      {
        name: 'Withdraw',
        path: 'withdraw',
        icon: <WalletIcon />,
        element: <SafeWithdraw />,
        loginNeeded: 'web3',
      },
      {
        name: 'Wrapper',
        path: 'wrapper',
        icon: <PaidIcon />,
        element: <WrapperPage />,
        loginNeeded: 'web3',
      },
      {
        name: 'Safe Settings',
        path: 'safe-settings',
        icon: <LockIcon />,
        element: <SafeSettings />,
        loginNeeded: 'web3',
      },
    ],
  },
];

export const applicationMapDev: ApplicationMapType = [
  {
    groupName: 'DEVELOP / Steps',
    path: 'steps',
    icon: <DevelopIcon />,
    items: [
      {
        name: 'Safe Onboarding',
        path: 'safe-onboarding',
        icon: <LockIcon />,
        element: <SafeOnboarding />,
        loginNeeded: 'web3',
      },
      {
        name: 'Add node',
        path: 'add-node',
        icon: <AddBoxIcon />,
        element: <AddNode />,
        loginNeeded: 'web3',
      },
      {
        name: 'Select node',
        path: 'select-node-type',
        icon: <AddBoxIcon />,
        element: <SelectNodeType />,
        loginNeeded: 'web3',
      },
      {
        name: 'Docker',
        path: 'docker-installation',
        icon: <AddBoxIcon />,
        element: <DockerInstallation />,
        loginNeeded: 'web3',
      },
      {
        name: 'Node Address',
        path: 'node-address',
        icon: <AddBoxIcon />,
        element: <NodeAddress />,
        loginNeeded: 'web3',
      },
      {
        name: 'xdai to node',
        path: 'xdai-to-node',
        icon: <AddBoxIcon />,
        element: <XdaiToNodePage />,
      },
    ],
  },
];

function createApplicationMap() {
  const temp: ApplicationMapType = [];
  if (environment === 'dev' || environment === 'node') applicationMapNode.map((elem) => temp.push(elem));
  if (environment === 'dev' || environment === 'web3') applicationMapWeb3.map((elem) => temp.push(elem));
  if (environment === 'dev') applicationMapDev.map((elem) => temp.push(elem));
  return temp;
}

export const applicationMap: ApplicationMapType = createApplicationMap();

const LayoutEnhanced = () => {
  const dispatch = useAppDispatch();
  const nodeConnected = useAppSelector((store) => store.auth.status.connected);
  const account = useAppSelector((selector) => selector.web3.account);
  const isConnected = useAppSelector((selector) => selector.web3.status.connected);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const [searchParams, set_searchParams] = useSearchParams();
  const apiEndpoint = searchParams.get('apiEndpoint');
  const apiToken = searchParams.get('apiToken');

  useEffect(() => {
    if (!apiEndpoint) return;
    if (loginData.apiEndpoint === apiEndpoint && loginData.apiToken === apiToken) return;
    dispatch(
      authActions.useNodeData({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      }),
    );
    if (!apiToken) return;
    const useNode = async () => {
      const loginInfo = await dispatch(
        authActionsAsync.loginThunk({
          apiEndpoint,
          apiToken,
        }),
      ).unwrap();
      if (loginInfo) {
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
        dispatch(
          nodeActionsAsync.getAliasesThunk({
            apiToken,
            apiEndpoint,
          }),
        );
        dispatch(nodeActions.initializeMessagesWebsocket());
        dispatch(nodeActions.initializeLogsWebsocket());
      }
    };
    useNode();

    return () => {
      dispatch(nodeActions.closeLogsWebsocket());
      dispatch(nodeActions.closeMessagesWebsocket());
    };
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
          {(environment === 'dev' || environment === 'web3') && <ConnectSafe />}
          {(environment === 'dev' || environment === 'web3') && <ConnectWeb3 inTheAppBar />}
          {(environment === 'dev' || environment === 'node') && <ConnectNode />}
        </>
      }
      drawerRight={(isConnected || nodeConnected) && <InfoBar />}
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

const router = createBrowserRouter(routes);

export default router;
