import styled from '@emotion/styled';
import { useEffect } from 'react';
import Chart from 'react-apexcharts';
import { useAppDispatch, useAppSelector } from '../../store';
import { actionsAsync } from '../../store/slices/node/actionsAsync';
import { exportToFile } from '../../utils/helpers';

// HOPR components
import { SubpageTitle } from '../../components/SubpageTitle';
import IconButton from '../../future-hopr-lib-components/Button/IconButton';
import Section from '../../future-hopr-lib-components/Section';
import { TableExtended } from '../../future-hopr-lib-components/Table/columed-data';

// Mui
import GetAppIcon from '@mui/icons-material/GetApp';
import { Paper } from '@mui/material';
import Tooltip from '../../future-hopr-lib-components/Tooltip/tooltip-fixed-width';

const metricsHashMap = {
  connect_counter_client_relayed_packets: {
    tooltipText: 'The number of packets sent by your node which were relayed through a PRN (TURN client).',
  },
  connect_counter_direct_packets: {
    tooltipText: 'The number of packets sent directly from your node to another node (over TCP).',
  },
  connect_counter_failed_conns: { tooltipText: 'The number of failed connection attempts made by your node.' },
  connect_counter_failed_direct_dials: {
    tooltipText: 'The number of failed direct connection attempts made by your node (direct dials).',
  },
  connect_counter_failed_relay_reqs: {
    tooltipText: 'The number of failed relayed connection attempts made to your node.',
  },
  connect_counter_failed_relayed_dials: {
    tooltipText: 'The number of failed relayed connection attempts made by your node.',
  },
  connect_counter_relay_reconnects: {
    tooltipText:
      'The number of relayed connections made by your node that were re-established after being disconnected.',
  },
  connect_counter_server_relayed_packets: { tooltipText: '' }, // Nothing on Copy document
  connect_counter_successful_conns: { tooltipText: 'The number of successful connection attempts made by your node.' },
  connect_counter_successful_direct_dials: {
    tooltipText: 'The number of successful direct connection attempts made by your node (direct dials).',
  },
  connect_counter_successful_relay_reqs: {
    tooltipText: 'The number of successful relayed connection attempts made to your node.',
  },
  connect_counter_successful_relayed_dials: {
    tooltipText: 'The number of successful relayed connection attempts made by your node.',
  },
  connect_counter_tcp_stun_requests: { tooltipText: 'The number of STUN requests made to your node (over TCP).' },
  connect_counter_udp_stun_requests: { tooltipText: 'The number of STUN requests made to your node (over UDP).' },
  connect_counter_webrtc_packets: {
    tooltipText: 'The number of packets sent directly from your node to another node (over WebRTC).',
  },
  connect_gauge_conns_to_relays: { tooltipText: 'The number of Public Relay Nodes (PRNs) you are connected to.' },
  connect_gauge_evicted_relayed_conns: {
    tooltipText: 'The number of connections made through your node as a PRN that have now been removed.',
  },
  connect_gauge_node_is_exposed: { tooltipText: 'Whether or not your node considers itself an exposed host.' },
  connect_gauge_relayed_conns: { tooltipText: 'The number of connections your node is acting as a relay for.' },
  connect_gauge_used_relays: { tooltipText: 'The number of Public Relay Node connections your node considers active.' },
  core_counter_acked_tickets: { tooltipText: 'The number of tickets your node has sent an acknowledgement for.' },
  core_counter_created_tickets: { tooltipText: 'The number of tickets your node has created.' },
  core_counter_failed_send_messages: { tooltipText: 'The number of messages your node has failed to send.' },
  core_counter_forwarded_messages: {
    tooltipText: 'The number of messages your node has forwarded (this is what you earn tickets for).',
  },
  core_counter_heartbeat_failed_pings: { tooltipText: 'The number of failed pings made by your node.' },
  core_counter_heartbeat_successful_pings: { tooltipText: 'The number of successful pings made by your node.' },
  core_counter_packets: { tooltipText: 'The number of data packets created by your node.' },
  core_counter_received_failed_acks: {
    tooltipText: 'The number of messages your node failed to receive an acknowledgement for.',
  },
  core_counter_received_messages: { tooltipText: 'The number of messages received by your node.' },
  core_counter_received_successful_acks: {
    tooltipText: 'The number of messages your node has successfully received an acknowledgement for.',
  },
  core_counter_sent_acks: {
    tooltipText: 'The number of messages your node has successfully sent an acknowledgement for.',
  },
  core_counter_sent_messages: { tooltipText: 'The number of messages sent by your node.' },
  core_counter_strategy_ticks: { tooltipText: 'The number of strategy decisions made by your node (ticks).' },
  core_ethereum_counter_indexer_announcements: { tooltipText: 'The number of announcements seen by your node.' },
  core_ethereum_counter_indexer_processed_unconfirmed_blocks: {
    tooltipText: 'The number of unconfirmed blocks on-chain which have been processed by your node.',
  },
  core_ethereum_counter_indexer_tickets_redeemed: { tooltipText: 'The number of tickets redeemed by your node.' },
  core_ethereum_counter_losing_tickets: { tooltipText: 'The number of tickets your own which are empty (losing).' },
  core_ethereum_counter_num_send_transactions: {
    tooltipText: 'The number of on-chain transaction calls made by your node.',
  },
  core_ethereum_counter_winning_tickets: {
    tooltipText: 'The number of tickets owned by your node which contain HOPR tokens (winning).',
  },
  core_ethereum_gauge_indexer_block_number: { tooltipText: 'The current block number. ' },
  core_gauge_mixer_average_packet_delay: {
    tooltipText: 'The average amount of time packets are delayed through your node in a single cycle.',
  },
  core_gauge_mixer_queue_size: { tooltipText: 'The number of packets in queue to be mixed by your node.' },
  core_gauge_network_health: {
    tooltipText: (
      <span>
        Unknown: Node has just been started recently
        <br />
        Red: No connection
        <br />
        Orange: low-quality connection
        <br />
        Yellow/Green: High-quality node
      </span>
    ),
  },
  core_gauge_num_incoming_channels: { tooltipText: 'The number of incoming channels connected to your node.' },
  core_gauge_num_outgoing_channels: { tooltipText: 'The number of outgoing channels connected to your node.' },
  core_gauge_num_peers: { tooltipText: 'The total number of peers visible to your node.' },
  core_gauge_strategy_last_closed_channels: {
    tooltipText: 'The number of channels closed by your node due to its last strategy decision (tick).',
  },
  core_gauge_strategy_last_opened_channels: {
    tooltipText: 'The number of channels opened by your node due to its last strategy decision (tick).',
  },
  core_gauge_strategy_max_auto_channels: {
    tooltipText: 'The current maximum amount of channels your node strategy allows you to maintain.',
  },
  hoprd_counter_api_failed_send_msg: { tooltipText: 'The number of failed API calls made by your node (POST).' },
  hoprd_counter_api_successful_send_msg: {
    tooltipText: 'The number of successful API calls made by your node (POST).',
  },
  hoprd_gauge_nodejs_num_detached_contexts: {
    tooltipText: "The number of detached v8 engine contexts which haven't been garbage collected.",
  },
  hoprd_gauge_nodejs_num_native_contexts: { tooltipText: 'The number of active top-level v8 engine contexts.' },
  hoprd_gauge_nodejs_total_alloc_heap_bytes: { tooltipText: 'Total allocated memory for the heap in the v8 engine.' },
  hoprd_gauge_nodejs_total_available_heap_bytes: { tooltipText: "Total available memory in the v8 engine's heap." },
  hoprd_gauge_nodejs_total_used_heap_bytes: { tooltipText: 'Current amount of v8 memory being used in v8.' },
  hoprd_gauge_startup_unix_time_seconds: {
    tooltipText: 'A Unix timestamp of the last time these metrics were collected.',
  },
  hoprd_mgauge_version: {
    tooltipText:
      'The version your node is running in which smaller patches are compatible. This will often be a rounded version of your node version.',
  },
} as Record<string, { tooltipText: string | JSX.Element }>;

const TableTitle = styled.p`
  font-family: 'Source Code Pro';
  font-size: 14px;
  font-weight: 700;
  height: 18px;
  overflow-wrap: break-word;
  padding: 8px;
`;

function MetricsPage() {
  const metrics = useAppSelector((store) => store.node.metrics.data);
  const metricsFetching = useAppSelector((store) => store.node.metrics.isFetching);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const { apiEndpoint, apiToken } = loginData;

  const dispatch = useAppDispatch();

  useEffect(() => {
    handleRefresh();
  }, [apiEndpoint, apiToken]);

  const handleRefresh = () => {
    if (!apiEndpoint) return;

    dispatch(
      actionsAsync.getPrometheusMetricsThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      }),
    );
  };

  const isTooltipTextString = (tooltipText: string | JSX.Element): boolean => {
    return typeof tooltipText === 'string';
  };

  function renderMetricsTable() {
    const render: JSX.Element[] = [];
    for (const [key, value] of Object.entries(metrics.parsed)) {
      if (!value.data) return;

      render.push(
        <tr key={key}>
          <th>
            <Tooltip
              title={metricsHashMap[key]?.tooltipText}
              notWide={isTooltipTextString(metricsHashMap[key]?.tooltipText)}
            >
              <span>{value.name}</span>
            </Tooltip>
          </th>

          <td>
            {value.data.length === 1 &&
              (typeof value.data[0] === 'string' || typeof value.data[0] === 'number') &&
              value.data[0]}
            {value.data.length !== 1 && typeof value.data === 'object' && JSON.stringify(value.data)}
          </td>
        </tr>,
      );
    }
    return <tbody>{render}</tbody>;
  }

  const getNumberArrayFromUnknown = (unknownMetrics: typeof metrics, property: string): number[] => {
    return unknownMetrics?.parsed?.[property]?.data.map(Number);
  };

  return (
    <Section
      fullHeightMin
      yellow
    >
      <SubpageTitle
        title="METRICS"
        refreshFunction={handleRefresh}
        reloading={metricsFetching}
        actions={
          <>
            <IconButton
              iconComponent={<GetAppIcon />}
              tooltipText={
                <span>
                  EXPORT
                  <br />
                  metrics as a text file
                </span>
              }
              onClick={() => {
                exportToFile(metrics.raw ? metrics.raw : 'error', 'metrics.txt', 'text/txt');
              }}
            />
          </>
        }
      />
      <Paper
        style={{
          padding: '24px',
          width: 'calc( 100% - 48px )',
        }}
      >
        <TableExtended width1stColumn={'400px'}>{renderMetricsTable()}</TableExtended>
        {/* <br />
        <br />
        <br /> */}

        {/* TODO: bring back some tables in future versions */}

        {/* <TableTitle>
          <Tooltip
            title="Displays the total time a single ping takes to complete (seconds)."
            notWide
          >
            <span>Total ping time</span>
          </Tooltip>
        </TableTitle>
        <Chart
          options={{
            xaxis: {
              categories: metrics?.parsed?.core_histogram_ping_time_seconds?.categories
                ? metrics?.parsed?.core_histogram_ping_time_seconds?.categories
                : [],
            },
          }}
          series={[{ data: getNumberArrayFromUnknown(metrics, 'core_histogram_ping_time_seconds') ?? [] }]}
          type="bar"
          height={300}
          style={{
            maxWidth: '100%',
            width: '100%',
          }}
        />

        <TableTitle>
          <Tooltip
            title="Displays the start-up time for your node (seconds)."
            notWide
          >
            <span>Start-up time</span>
          </Tooltip>
        </TableTitle>
        <Chart
          options={{
            xaxis: {
              categories: metrics?.parsed?.hoprd_histogram_startup_time_seconds?.categories
                ? metrics?.parsed?.hoprd_histogram_startup_time_seconds?.categories
                : [],
            },
          }}
          series={[{ data: getNumberArrayFromUnknown(metrics, 'hoprd_histogram_startup_time_seconds') ?? [] }]}
          type="bar"
          height={300}
          style={{
            maxWidth: '100%',
            width: '100%',
          }}
        />

        <TableTitle>
          <Tooltip
            title="Displays the time it takes your node to reach a GREEN connection status (seconds)."
            notWide
          >
            <span>Time to reach high-level connection</span>
          </Tooltip>
        </TableTitle>
        <Chart
          options={{
            xaxis: {
              categories: metrics?.parsed?.hoprd_histogram_time_to_green_second?.categories
                ? metrics?.parsed?.hoprd_histogram_time_to_green_seconds?.categories
                : [],
            },
          }}
          series={[{ data: getNumberArrayFromUnknown(metrics, 'hoprd_histogram_time_to_green_seconds') ?? [] }]}
          type="bar"
          height={300}
          style={{
            maxWidth: '100%',
            width: '100%',
          }}
        />

        <Tooltip
          title="Displays the latencies of received messages (seconds)."
          notWide
        >
          <TableTitle>Received message latencies</TableTitle>
        </Tooltip>
        <Chart
          options={{
            xaxis: {
              categories: metrics?.parsed?.hoprd_histogram_message_latency_ms?.categories
                ? metrics?.parsed?.hoprd_histogram_message_latency_ms?.categories
                : [],
            },
          }}
          series={[{ data: getNumberArrayFromUnknown(metrics, 'hoprd_histogram_message_latency_ms') ?? [] }]}
          type="bar"
          height={300}
          style={{
            maxWidth: '100%',
            width: '100%',
          }}
        />

        <Tooltip
          title="Displays your visible peers categorized by their connection quality."
          notWide
        >
          <TableTitle>Peers by quality</TableTitle>
        </Tooltip>
        <Chart
          options={{
            xaxis: {
              categories: metrics?.parsed?.core_mgauge_peers_by_quality?.categories
                ? metrics?.parsed?.core_mgauge_peers_by_quality?.categories
                : [],
            },
          }}
          series={[{ data: getNumberArrayFromUnknown(metrics, 'core_mgauge_peers_by_quality') ?? [] }]}
          type="bar"
          height={300}
          style={{
            maxWidth: '100%',
            width: '100%',
          }}
        /> */}
      </Paper>
    </Section>
  );
}

export default MetricsPage;
