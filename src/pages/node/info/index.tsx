import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useAppDispatch, useAppSelector } from '../../../store';
import { Link } from 'react-router-dom';
import { copyStringToClipboard } from '../../../utils/functions';
import { formatEther } from 'viem';

// Mui
import { Paper } from '@mui/material';

// HOPR Components
import Section from '../../../future-hopr-lib-components/Section';
import { actionsAsync as nodeActionsAsync } from '../../../store/slices/node/actionsAsync';
import { TableExtended } from '../../../future-hopr-lib-components/Table/columed-data';
import { SubpageTitle } from '../../../components/SubpageTitle';
import Tooltip from '../../../future-hopr-lib-components/Tooltip/tooltip-fixed-width';
import WithdrawModal from '../../../components/Modal/node/WithdrawModal';
import SmallActionButton from '../../../future-hopr-lib-components/Button/SmallActionButton';
import { ColorStatus } from '../../../components/InfoBar/details';
import ProgressBar from '../../../future-hopr-lib-components/Progressbar';

//Icons
import CopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';

//Info Components
import NodeUptime from './node-uptime';


const TdActionIcons = styled.td`
  display: flex;
  gap: 8px;
  align-items: center;
`;

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
  const nodeStartedEpoch = useAppSelector((store) => store.node.metrics.data.parsed?.hopr_up?.data[0]);
  const nodeStartedTime = nodeStartedEpoch && typeof(nodeStartedEpoch) === 'number'? new Date(nodeStartedEpoch*1000).toJSON().replace('T', ' ').replace('Z', ' UTC') : '-';
  const nodeSync = useAppSelector((store) => store.node.metricsParsed.nodeSync);


  useEffect(() => {
    fetchInfoData();
  }, [apiEndpoint, apiToken]);

  useEffect(() => {

    const watchSync = setInterval(() => {
      if (!apiEndpoint || (nodeSync && nodeSync === 1)) return;
      return dispatch(
        nodeActionsAsync.getPrometheusMetricsThunk({
          apiEndpoint,
          apiToken: apiToken ? apiToken : '',
        }),
      );
    }, 5_000);

    return () => {
      clearInterval(watchSync);
    };

  }, [nodeSync, apiEndpoint, apiToken]);

  const fetchInfoData = () => {
    if (!apiEndpoint) return;

    dispatch(
      nodeActionsAsync.getBalancesThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      })
    );
    dispatch(
      nodeActionsAsync.getChannelsThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      })
    );
    dispatch(
      nodeActionsAsync.getAddressesThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      })
    );
    dispatch(
      nodeActionsAsync.getVersionThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      })
    );
    dispatch(
      nodeActionsAsync.getInfoThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      })
    );
    dispatch(
      nodeActionsAsync.getPeersThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      })
    );
    dispatch(
      nodeActionsAsync.getAliasesThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      })
    );
    dispatch(
      nodeActionsAsync.getTicketStatisticsThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      })
    );
    dispatch(
      nodeActionsAsync.getPrometheusMetricsThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      })
    );
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
  if (!apiEndpoint) {
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
                  title="Whether or not your node is eligible to connect to the network"
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
                  title="The sync process of your node with the blockchain"
                  notWide
                >
                  <span>Sync process</span>
                </Tooltip>
              </th>
              <td>
                {
               nodeSync && typeof(nodeSync)==='number'?
                  <ProgressBar
                    value={nodeSync}
                  />
                :
                '-'
                }
              </td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The blockchain network your node is using for on-chain transactions"
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
              <td><ColorStatus className={`status-${info?.connectivityStatus}`}>{info?.connectivityStatus}</ColorStatus></td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The address your node announces to make itself reachable for other nodes"
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
                  title="The address your node uses to listen for incoming connections"
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
                  title="The amount of xDAI stored on your Node"
                  notWide
                >
                  <span>xDAI: Node</span>
                </Tooltip>
              </th>
              <td>{balances.native?.formatted} xDAI</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The amount of xDAI stored on your Safe"
                  notWide
                >
                  <span>xDAI: Safe</span>
                </Tooltip>
              </th>
              <td>{balances.safeNative?.formatted} xDAI</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The amount of wxHOPR stored on your Safe"
                  notWide
                >
                  <span>wxHOPR: Safe</span>
                </Tooltip>
              </th>
              <td>{balances.safeHopr?.formatted} wxHOPR</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The amount of wxHOPR tokens staked in the channels your Node has opened with counterparties"
                  notWide
                >
                  <span>wxHOPR: Channels OUT</span>
                </Tooltip>
              </th>
              <td>{balances.channels?.formatted} wxHOPR</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The amount of wxHOPR set as allowance for Node to use"
                  notWide
                >
                  <span>wxHOPR: Allowance</span>
                </Tooltip>
              </th>
              <td>{balances.safeHoprAllowance?.formatted} wxHOPR</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The total amount of wxHOPR staked in Safe and outgoing Channels"
                  notWide
                >
                  <span>wxHOPR: Total Staked</span>
                </Tooltip>
              </th>
              <td>
                {
                  balances.channels?.value &&
                  balances.safeHopr?.value ?
                  formatEther(BigInt(balances.channels?.value) + BigInt(balances.safeHopr?.value)) : '-'
                } wxHOPR
              </td>
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
              <TdActionIcons>
                {addresses?.hopr}
                {
                  addresses?.hopr &&
                  <SmallActionButton
                    onClick={() => navigator.clipboard.writeText(addresses?.hopr as string)}
                    tooltip={'Copy'}
                  >
                    <CopyIcon />
                  </SmallActionButton>
                }
              </TdActionIcons>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="Your node's Ethereum address"
                  notWide
                >
                  <span>Node Address</span>
                </Tooltip>
              </th>
              <TdActionIcons>
                {addresses?.native}
                {
                  addresses?.native &&
                  <>
                    <SmallActionButton
                      onClick={() => navigator.clipboard.writeText(addresses?.native as string)}
                      tooltip={'Copy'}
                    >
                      <CopyIcon />
                    </SmallActionButton>
                    <SmallActionButton
                      tooltip={'Open in gnosisscan.io'}
                    >
                      <Link to={`https://gnosisscan.io/address/${addresses?.native}`} target='_blank'>
                        <LaunchIcon />
                      </Link>
                    </SmallActionButton>
                  </>
                }
              </TdActionIcons>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="Your safe's Ethereum address"
                  notWide
                >
                  <span>Safe Address</span>
                </Tooltip>
              </th>
              <TdActionIcons>
                {info?.hoprNodeSafe}
                {
                  info?.hoprNodeSafe &&
                  <>
                    <SmallActionButton
                      onClick={() => navigator.clipboard.writeText(info.hoprNodeSafe as string)}
                      tooltip={'Copy'}
                    >
                      <CopyIcon />
                    </SmallActionButton>
                    <SmallActionButton
                      tooltip={'Open in gnosisscan.io'}
                    >
                      <Link to={`https://gnosisscan.io/address/${info.hoprNodeSafe}`} target='_blank'>
                        <LaunchIcon />
                      </Link>
                    </SmallActionButton>
                  </>
                }
              </TdActionIcons>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The contract address of the HOPR token"
                  notWide
                >
                  <span>Hopr Token Address</span>
                </Tooltip>
              </th>
              <TdActionIcons>
                {info?.hoprToken}
                {
                  info?.hoprToken &&
                  <>
                    <SmallActionButton
                      onClick={() => navigator.clipboard.writeText(info?.hoprToken as string)}
                      tooltip={'Copy'}
                    >
                      <CopyIcon />
                    </SmallActionButton>
                    <SmallActionButton
                      tooltip={'Open in gnosisscan.io'}
                    >
                      <Link to={`https://gnosisscan.io/address/${info?.hoprToken}`} target='_blank'>
                        <LaunchIcon />
                      </Link>
                    </SmallActionButton>
                  </>
                }
              </TdActionIcons>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The contract address of the Hopr management module"
                  notWide
                >
                  <span>Hopr management module address</span>
                </Tooltip>
              </th>
              <TdActionIcons>
                {info?.hoprManagementModule}
                {
                  info?.hoprManagementModule &&
                  <>
                    <SmallActionButton
                      onClick={() => navigator.clipboard.writeText(info.hoprManagementModule as string)}
                      tooltip={'Copy'}
                    >
                      <CopyIcon />
                    </SmallActionButton>
                    <SmallActionButton
                      tooltip={'Open on gnosisscan.io'}
                    >
                      <Link to={`https://gnosisscan.io/address/${info.hoprManagementModule}`} target='_blank'>
                        <LaunchIcon />
                      </Link>
                    </SmallActionButton>
                  </>
                }
              </TdActionIcons>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The contract address of the hoprChannels smart contract"
                  notWide
                >
                  <span>Hopr Channels Address</span>
                </Tooltip>
              </th>
              <TdActionIcons>
                {info?.hoprChannels}
                {
                  info?.hoprChannels &&
                  <>
                    <SmallActionButton
                      onClick={() => navigator.clipboard.writeText(info?.hoprChannels as string)}
                      tooltip={'Copy'}
                    >
                      <CopyIcon />
                    </SmallActionButton>
                    <SmallActionButton
                      tooltip={'Open in gnosisscan.io'}
                    >
                      <Link to={`https://gnosisscan.io/address/${info?.hoprChannels}`} target='_blank'>
                        <LaunchIcon />
                      </Link>
                    </SmallActionButton>
                  </>
                }
              </TdActionIcons>
            </tr>
          </tbody>
        </TableExtended>

        <TableExtended
          title="Node"
          style={{ marginBottom: '42px' }}
        >
          <tbody>
            <tr>
              <th>
                <Tooltip
                  title="The version of HOPR your node is running"
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
                  title="The environment your node is running in"
                  notWide
                >
                  <span>Environment</span>
                </Tooltip>
              </th>
              <td>{info?.network}</td>
            </tr>
            <tr
              key='node-startdate'
            >
              <th>
                <Tooltip
                  title="Date when you node was started"
                  notWide
                >
                  <span>Start date</span>
                </Tooltip>
              </th>
              <td>{nodeStartedTime}</td>
            </tr>
            <NodeUptime />
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
                  title="The number of incoming channels connected to your node"
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
                  title="The number of outgoing channels connected to your node"
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
                  title="The number of announced nodes on the network visible to your node"
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
                  title="The number of nodes on the network your node can reach"
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
