import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';

// Mui
import { Paper } from '@mui/material';

// HOPR Components
import Section from '../../future-hopr-lib-components/Section';
import { actionsAsync } from '../../store/slices/node/actionsAsync';
import { TableExtended } from '../../future-hopr-lib-components/Table/columed-data';
import { SubpageTitle } from '../../components/SubpageTitle';
import Tooltip from '../../future-hopr-lib-components/Tooltip/tooltip-fixed-width';
import WithdrawModal from '../../components/Modal/node/WithdrawModal';

function InfoPage() {
  const dispatch = useAppDispatch();
  const { apiEndpoint, apiToken } = useAppSelector((store) => store.auth.loginData);
  const balances = useAppSelector((store) => store.node.balances.data);
  const balancesFetching = useAppSelector((store) => store.node.balances.isFetching);
  const addresses = useAppSelector((store) => store.node.addresses.data);
  const addressesFetching = useAppSelector((store) => store.node.addresses.isFetching);
  const channels = useAppSelector((store) => store.node.channels.data);
  const channelsFetching = useAppSelector((store) => store.node.channels.isFetching);
  const version = useAppSelector((store) => store.node.version.data);
  const versionFetching = useAppSelector((store) => store.node.version.isFetching);
  const info = useAppSelector((store) => store.node.info.data);
  const infoFetching = useAppSelector((store) => store.node.info.isFetching);
  const peers = useAppSelector((store) => store.node.peers.data);
  const peersFetching = useAppSelector((store) => store.node.peers.isFetching);
  const aliases = useAppSelector((store) => store.node.aliases.data);
  const aliasesFetching = useAppSelector((store) => store.node.aliases.isFetching);
  const statistics = useAppSelector((store) => store.node.statistics.data);
  const statisticsFetching = useAppSelector((store) => store.node.statistics.isFetching);

  useEffect(() => {
    fetchInfoData();
  }, [apiEndpoint, apiToken]);

  const fetchInfoData = () => {
    if (apiEndpoint && apiToken) {
      dispatch(
        actionsAsync.getBalancesThunk({
          apiEndpoint,
          apiToken,
        })
      );
      dispatch(
        actionsAsync.getChannelsThunk({
          apiEndpoint,
          apiToken,
        })
      );
      dispatch(
        actionsAsync.getAddressesThunk({
          apiEndpoint,
          apiToken,
        })
      );
      dispatch(
        actionsAsync.getVersionThunk({
          apiEndpoint,
          apiToken,
        })
      );
      dispatch(
        actionsAsync.getInfoThunk({
          apiEndpoint,
          apiToken,
        })
      );
      dispatch(
        actionsAsync.getPeersThunk({
          apiEndpoint,
          apiToken,
        })
      );
      dispatch(
        actionsAsync.getAliasesThunk({
          apiEndpoint,
          apiToken,
        })
      );
      dispatch(
        actionsAsync.getStatisticsThunk({
          apiEndpoint,
          apiToken,
        })
      );
    }
  };

  // This will allow us to improve readability on the reloading prop for SubpageTitle
  const isFetchingAnyData = [
    balancesFetching,
    addressesFetching,
    channelsFetching,
    versionFetching,
    infoFetching,
    peersFetching,
    aliasesFetching,
    statisticsFetching,
  ].includes(true);

  // check if user is logged in
  if (!apiEndpoint || !apiToken) {
    return (
      <Section
        className="Section--selectNode"
        id="Section--selectNode"
        yellow
        fullHeightMin
      >
        Login to node
      </Section>
    );
  }

  return (
    <Section
      className="Section--selectNode"
      id="Section--selectNode"
      fullHeightMin
      yellow
    >
      <SubpageTitle
        title="INFO"
        refreshFunction={fetchInfoData}
        reloading={isFetchingAnyData}
        actions={<WithdrawModal />}
      />
      <Paper
        style={{
          padding: '24px',
          width: 'calc( 100% - 48px )',
        }}
      >
        <TableExtended
          title="Network"
          style={{ marginBottom: '42px' }}
        >
          <tbody>
            <tr>
              <th>
                <Tooltip
                  title="Whether or not your node is eligible to connect to the Monte Rosa network."
                  notWide
                >
                  <span>Eligible</span>
                </Tooltip>
              </th>
              <td>{info?.isEligible ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The blockchain network your node is using for on-chain transactions."
                  notWide
                >
                  <span>Blockchain Network</span>
                </Tooltip>
              </th>
              <td>{info?.chain}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title={
                    <ul
                      style={{
                        margin: 0,
                        padding: '0 0 0 16px',
                      }}
                    >
                      <span style={{ margin: '0 0 0 -16px' }}>Possible statuses:</span>
                      <li>Unknown: Node has just been started recently</li>
                      <li>Red: No connection</li>
                      <li>Orange: low-quality connection</li>
                      <li>Yellow/Green: High-quality node</li>
                    </ul>
                  }
                >
                  <span>Connectivity status</span>
                </Tooltip>
              </th>
              <td>{info?.connectivityStatus}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The address your node announces to make itself reachable for other nodes."
                  notWide
                >
                  <span>Announced address</span>
                </Tooltip>
              </th>
              <td>{info?.announcedAddress}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The address your node uses to listen for incoming connections."
                  notWide
                >
                  <span>Listening address</span>
                </Tooltip>
              </th>
              <td>{info?.listeningAddress}</td>
            </tr>
          </tbody>
        </TableExtended>

        <TableExtended
          title="Balances"
          style={{ marginBottom: '42px' }}
        >
          <tbody>
            <tr>
              <th>
                <Tooltip
                  title="The amount of xDAI stored on your node"
                  notWide
                >
                  <span>xDAI (Node)</span>
                </Tooltip>
              </th>
              <td>{balances.native?.formatted} xDAI</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The amount of xDAI stored on your node"
                  notWide
                >
                  <span>xDAI (Safe)</span>
                </Tooltip>
              </th>
              <td>{balances.safeNative?.formatted} xDAI</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The amount of xDAI stored on your node"
                  notWide
                >
                  <span>wxHOPR (Safe)</span>
                </Tooltip>
              </th>
              <td>{balances.safeHopr?.formatted} wxHOPR</td>
            </tr>
          </tbody>
        </TableExtended>

        <TableExtended
          title="Addresses"
          style={{ marginBottom: '42px' }}
        >
          <tbody>
            <tr>
              <th>
                <Tooltip
                  title="Your node's HOPR address, used by other node's to identify your node and send it messages (equivalent to a public key). "
                  notWide
                >
                  <span>Node PeerID</span>
                </Tooltip>
              </th>
              <td>{addresses?.hopr}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="Your node's Ethereum address."
                  notWide
                >
                  <span>Node Address</span>
                </Tooltip>
              </th>
              <td>{addresses?.native}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="Your safe's Ethereum address."
                  notWide
                >
                  <span>Safe Address</span>
                </Tooltip>
              </th>
              <td>{info?.nodeSafe}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="Your module's Ethereum address."
                  notWide
                >
                  <span>Module Address</span>
                </Tooltip>
              </th>
              <td>{info?.nodeManagementModule}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The contract address of the HOPR token."
                  notWide
                >
                  <span>hoprToken</span>
                </Tooltip>
              </th>
              <td>{info?.hoprToken}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The contract address of the hoprChannels smart contract."
                  notWide
                >
                  <span>hoprChannels</span>
                </Tooltip>
              </th>
              <td>{info?.hoprChannels}</td>
            </tr>
          </tbody>
        </TableExtended>

        <TableExtended
          title="Software"
          style={{ marginBottom: '42px' }}
        >
          <tbody>
            <tr>
              <th>
                <Tooltip
                  title="The version of HOPR your node is running."
                  notWide
                >
                  <span>Version</span>
                </Tooltip>
              </th>
              <td>{version?.replaceAll('"', '')}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The environment your node is running in."
                  notWide
                >
                  <span>Environment</span>
                </Tooltip>
              </th>
              <td>{info?.network}</td>
            </tr>
          </tbody>
        </TableExtended>

        <TableExtended
          title="Channels"
          style={{ marginBottom: '42px' }}
        >
          <tbody>
            <tr>
              <th>
                <Tooltip
                  title="The number of incoming channels connected to your node."
                  notWide
                >
                  <span>Incoming</span>
                </Tooltip>
              </th>
              <td>{channels?.incoming.filter((channel) => channel.status === 'Open').length}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The number of outgoing channels connected to your node."
                  notWide
                >
                  <span>Outgoing</span>
                </Tooltip>
              </th>
              <td>{channels?.outgoing.filter((channel) => channel.status === 'Open').length}</td>
            </tr>
          </tbody>
        </TableExtended>

        <TableExtended
          title="Nodes on the network"
          style={{ marginBottom: '42px' }}
        >
          <tbody>
            <tr>
              <th>
                <Tooltip
                  title="The number of announced nodes on the network visible to your node."
                  notWide
                >
                  <span>Announced</span>
                </Tooltip>
              </th>
              <td>{peers?.announced.length}</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The number of nodes on the network your node can reach."
                  notWide
                >
                  <span>Connected</span>
                </Tooltip>
              </th>
              <td>{peers?.connected.length}</td>
            </tr>
          </tbody>
        </TableExtended>

        <TableExtended
          title="Aliases"
          style={{ marginBottom: '42px' }}
        >
          <tbody>
            <tr>
              <th>Count</th>
              <td>{Object.keys(aliases ?? {}).length}</td>
            </tr>
          </tbody>
        </TableExtended>
      </Paper>
    </Section>
  );
}

export default InfoPage;
