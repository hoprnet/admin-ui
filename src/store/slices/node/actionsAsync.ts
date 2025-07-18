import { ActionReducerMapBuilder, AnyAction, ThunkDispatch, createAsyncThunk } from '@reduxjs/toolkit';
import { initialState } from './initialState';
import { v4 as uuidv4 } from 'uuid';
import {
  type BasePayloadType,
  type CloseChannelPayloadType,
  type CreateTokenPayloadType,
  type DeleteTokenPayloadType,
  type GetChannelPayloadType,
  type GetPeersPayloadType,
  type OpenChannelPayloadType,
  type PingPeerPayloadType,
  type GetChannelTicketsPayloadType,
  type GetConfigurationResponseType,
  type FundChannelsPayloadType,
  type FundChannelsResponseType,
  type WithdrawPayloadType,
  type RedeemChannelTicketsPayloadType,
  type GetPeerPayloadType,
  type GetChannelResponseType,
  type GetPeersResponseType,
  type GetInfoResponseType,
  type GetTicketStatisticsResponseType,
  type GetTokenResponseType,
  type GetEntryNodesResponseType,
  type GetChannelTicketsResponseType,
  type GetChannelsResponseType,
  type IsNodeReadyResponseType,
  flows,
  api,
  utils,
  type OpenChannelResponseType,
  type CreateTokenResponseType,
  type GetPeerResponseType,
  type GetBalancesResponseType,
  type GetTicketPricePayloadType,
  type GetSessionsPayloadType,
  type GetSessionsResponseType,
  type OpenSessionPayload,
  type GetTicketPriceResponseType,
  type GetMinimumNetworkProbabilityResponseType,
  type OpenSessionPayloadType,
  type CloseSessionPayloadType,
} from '@hoprnet/hopr-sdk';
import { parseMetrics } from '../../../utils/metrics';
import { RootState } from '../..';
import { formatEther, parseEther } from 'viem';
import { nodeActionsFetching } from './actionsFetching';
import { sendNotification } from '../../../hooks/useWatcher/notifications';
import { useAppDispatch } from '../../../store';
import { authActions } from '../auth';

const { sdkApiError } = utils;
const {
  closeChannel,
  createToken,
  deleteToken,
  getAddresses,
  getBalances,
  getChannel,
  getChannelTickets,
  getChannels,
  getConfiguration,
  getEntryNodes,
  getInfo,
  getMetrics,
  getPeers,
  getTicketStatistics,
  getToken,
  getTicketPrice,
  getMinimumTicketProbability,
  getSessions,
  openSession,
  closeSession,
  fundChannel,
  getVersion,
  openChannel,
  pingPeer,
  getPeer, // old getPeerInfo
  redeemChannelTickets,
  redeemAllTickets,
  resetTicketStatistics,
  withdraw,
  isNodeReady,
} = api;
const { openMultipleChannels } = flows;

const isNodeReadyThunk = createAsyncThunk<IsNodeReadyResponseType | undefined, BasePayloadType, { state: RootState }>(
  'node/isNodeReady',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const res = await isNodeReady(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.nodeIsReady.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getInfoThunk = createAsyncThunk<GetInfoResponseType | undefined, BasePayloadType, { state: RootState }>(
  'node/getInfo',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setInfoFetching(true));
    try {
      const info = await getInfo(payload);
      return info;
    } catch (e) {
      console.error(e);
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.info.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getAddressesThunk = createAsyncThunk<
  | {
      native: string;
    }
  | undefined,
  BasePayloadType & { force?: boolean },
  { state: RootState }
>(
  'node/getAccount',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setAddressesFetching(true));
    try {
      const addresses = await getAddresses(payload);
      if (addresses?.native) {
        dispatch(
          authActions.addNodeJazzIcon({
            apiEndpoint: payload.apiEndpoint as string,
            jazzIcon: addresses.native,
          }),
        );
      }
      return addresses;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      if (_payload.force) {
        return true;
      }

      const isFetching = getState().node.addresses.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getBalancesThunk = createAsyncThunk<
  GetBalancesResponseType | undefined,
  BasePayloadType & { force?: boolean },
  { state: RootState; dispatch: ThunkDispatch<RootState, unknown, AnyAction> }
>(
  'node/getBalances',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setBalancesFetching(true));
    try {
      const balances = await getBalances(payload);
      return balances;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      if (_payload.force) {
        return true;
      }

      const isFetching = getState().node.balances.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getBalanceInAllSafeChannelsThunk = createAsyncThunk<
  GetChannelsResponseType | undefined,
  BasePayloadType,
  { state: RootState }
>(
  'node/getBalanceInAllSafeChannels',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const channels = await getChannels(payload);
      return channels;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.channels.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getChannelsThunk = createAsyncThunk<GetChannelsResponseType | undefined, BasePayloadType, { state: RootState }>(
  'node/getChannels',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const channels = await getChannels(payload);
      return channels;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.channels.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getConfigurationThunk = createAsyncThunk<
  GetConfigurationResponseType | undefined,
  BasePayloadType,
  { state: RootState }
>(
  'node/getConfiguration',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const configuration = await getConfiguration(payload);
      console.log('getConfigurationThunk', configuration);
      return configuration;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.configuration.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getPeersThunk = createAsyncThunk<GetPeersResponseType | undefined, GetPeersPayloadType, { state: RootState }>(
  'node/getPeers',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setPeersFetching(true));
    try {
      const peers = await getPeers(payload);
      return peers;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.peers.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getPeerInfoThunk = createAsyncThunk<GetPeerResponseType | undefined, GetPeerPayloadType, { state: RootState }>(
  'node/getPeerInfo',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setPeerInfoFetching(true));
    try {
      const peerInfo = await getPeer(payload);
      return peerInfo;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.peerInfo.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getTicketStatisticsThunk = createAsyncThunk<
  GetTicketStatisticsResponseType | undefined,
  BasePayloadType,
  { state: RootState }
>(
  'node/getTicketStatistics',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setTicketStatisticsFetching(true));
    try {
      const statistics = await getTicketStatistics(payload);
      return statistics;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.statistics.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getTokenThunk = createAsyncThunk<GetTokenResponseType | undefined, BasePayloadType, { state: RootState }>(
  'node/getToken',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setTokensFetching(true));
    try {
      const token = await getToken(payload);
      return token;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.tokens.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getEntryNodesThunk = createAsyncThunk<
  GetEntryNodesResponseType | undefined,
  BasePayloadType,
  { state: RootState }
>(
  'node/getEntryNodes',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setEntryNodesFetching(true));
    try {
      const entryNodes = await getEntryNodes(payload);
      return entryNodes;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.entryNodes.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getVersionThunk = createAsyncThunk<string | undefined, BasePayloadType, { state: RootState }>(
  'node/getVersion',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setVersionFetching(true));
    try {
      const version = await getVersion(payload);
      return version;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.version.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const withdrawThunk = createAsyncThunk<string | undefined, WithdrawPayloadType, { state: RootState }>(
  'node/withdraw',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setTransactionsFetching(true));
    try {
      const res = await withdraw(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.transactions.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const closeChannelThunk = createAsyncThunk<
  | {
      channelStatus: string;
      receipt?: string | undefined;
    }
  | undefined,
  CloseChannelPayloadType,
  { state: RootState }
>(
  'node/closeChannel',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const res = await closeChannel(payload);
      dispatch(getChannelsThunk(payload));
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const channelId = _payload.channelId;
      let isClosing = false;
      if (getState().node.channels.parsed.outgoing[channelId]) {
        isClosing = !!getState().node.channels.parsed.outgoing[channelId].isClosing;
      } else if (getState().node.channels.parsed.incoming[channelId]) {
        isClosing = !!getState().node.channels.parsed.incoming[channelId].isClosing;
      }
      if (isClosing) {
        return false;
      }
    },
  },
);

const openChannelThunk = createAsyncThunk<
  OpenChannelResponseType | undefined,
  OpenChannelPayloadType,
  { state: RootState }
>('node/openChannel', async (payload, { rejectWithValue }) => {
  try {
    const res = await openChannel(payload);
    return res;
  } catch (e) {
    if (e instanceof sdkApiError) {
      return rejectWithValue(e);
    }
    return rejectWithValue({ status: JSON.stringify(e) });
  }
});

const fundChannelThunk = createAsyncThunk<
  FundChannelsResponseType | undefined,
  FundChannelsPayloadType,
  { state: RootState }
>('node/fundChannel', async (payload, { rejectWithValue }) => {
  try {
    const res = await fundChannel(payload);
    return res;
  } catch (e) {
    if (e instanceof sdkApiError) {
      return rejectWithValue(e);
    }
    return rejectWithValue({ status: JSON.stringify(e) });
  }
});

// will not be used for now, as it doesn't give good errors
const openMultipleChannelsThunk = createAsyncThunk(
  'node/openMultipleChannels',
  async (
    payload: {
      apiEndpoint: string;
      apiToken: string;
      peerIds: string[];
      amount: string;
      timeout?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await openMultipleChannels({
        apiEndpoint: payload.apiEndpoint,
        apiToken: payload.apiToken,
        timeout: payload.timeout,
        destinations: payload.peerIds,
        amount: payload.amount,
      });
      if (typeof res === 'undefined')
        throw new sdkApiError({
          status: 400,
          statusText: 'Node does not have enough balance to fund channels',
        });
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
);

const redeemChannelTicketsThunk = createAsyncThunk<
  boolean | undefined,
  RedeemChannelTicketsPayloadType,
  { state: RootState }
>(
  'node/redeemChannelTickets',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setRedeemAllTicketsFetching(true));
    try {
      const res = await redeemChannelTickets(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.redeemAllTickets.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const pingNodeThunk = createAsyncThunk('node/pingNode', async (payload: PingPeerPayloadType, { rejectWithValue }) => {
  try {
    const res = await pingPeer(payload);
    return {
      ...res,
      peerId: payload.address,
    };
  } catch (e) {
    if (e instanceof sdkApiError) {
      return rejectWithValue(e);
    }
    return rejectWithValue({ status: JSON.stringify(e) });
  }
});

const redeemAllTicketsThunk = createAsyncThunk<boolean | undefined, BasePayloadType, { state: RootState }>(
  'node/redeemAllTickets',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setRedeemAllTicketsFetching(true));
    try {
      const res = await redeemAllTickets(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.redeemAllTickets.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const resetTicketStatisticsThunk = createAsyncThunk<boolean | undefined, BasePayloadType, { state: RootState }>(
  'node/resetTicketStatisticsThunk',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setResetTicketStatisticsFetching(true));
    try {
      const res = await resetTicketStatistics(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.resetTicketStatistics.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const createTokenThunk = createAsyncThunk<
  CreateTokenResponseType | undefined,
  CreateTokenPayloadType,
  { state: RootState }
>(
  'node/createToken',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setTokensFetching(true));
    try {
      const res = await createToken(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.tokens.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const deleteTokenThunk = createAsyncThunk<
  { deleted: boolean; id: string } | undefined,
  DeleteTokenPayloadType,
  { state: RootState }
>(
  'node/deleteToken',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setTokensFetching(true));
    try {
      const res = await deleteToken(payload);
      return {
        deleted: res,
        id: payload.id,
      };
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.tokens.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getPrometheusMetricsThunk = createAsyncThunk<string | undefined, BasePayloadType, { state: RootState }>(
  'node/getPrometheusMetrics',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setMetricsFetching(true));
    try {
      const res = await getMetrics(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.metrics.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getTicketPriceThunk = createAsyncThunk<
  GetTicketPriceResponseType | undefined,
  BasePayloadType,
  { state: RootState }
>(
  'node/getTicketPrice',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setTicketPriceFetching(true));
    try {
      const res = await getTicketPrice(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.ticketPrice.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getMinimumNetworkProbabilityThunk = createAsyncThunk<
  GetMinimumNetworkProbabilityResponseType | undefined,
  BasePayloadType,
  { state: RootState }
>(
  'node/getMinimumTicketProbability',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.setMinimumTicketProbabilityFetching(true));
    try {
      const res = await getMinimumTicketProbability(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.probability.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const getSessionsThunk = createAsyncThunk<GetSessionsResponseType | undefined, BasePayloadType, { state: RootState }>(
  'node/getSessionsThunk',
  async (payload, { rejectWithValue, dispatch }) => {
    dispatch(nodeActionsFetching.openSessionsFetching(true));
    try {
      const bothRes = await Promise.all([
        getSessions({
          ...payload,
          protocol: 'tcp',
        }),
        getSessions({
          ...payload,
          protocol: 'udp',
        }),
      ]);
      const res = [...bothRes[0], ...bothRes[1]];
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().node.sessions.isFetching;
      if (isFetching) {
        return false;
      }
    },
  },
);

const openSessionThunk = createAsyncThunk(
  'node/openSession',
  async (payload: OpenSessionPayloadType, { rejectWithValue }) => {
    try {
      const res = await openSession(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
);

const closeSessionThunk = createAsyncThunk(
  'node/closeSession',
  async (payload: CloseSessionPayloadType, { rejectWithValue }) => {
    try {
      const res = await closeSession(payload);
      return res;
    } catch (e) {
      if (e instanceof sdkApiError) {
        return rejectWithValue(e);
      }
      return rejectWithValue({ status: JSON.stringify(e) });
    }
  },
);

const isCurrentApiEndpointTheSame = createAsyncThunk<boolean, string, { state: RootState }>(
  'node/isCurrentApiEndpointTheSame',
  async (payload, { getState }) => {
    const apiEndpoint = getState().node.apiEndpoint;
    console.log('node/isCurrentApiEndpointTheSame', apiEndpoint, payload);
    return payload === apiEndpoint;
  },
);

export const createAsyncReducer = (builder: ActionReducerMapBuilder<typeof initialState>) => {
  // isNodeReady
  builder.addCase(isNodeReadyThunk.pending, (state) => {
    state.nodeIsReady.isFetching = true;
  });
  builder.addCase(isNodeReadyThunk.rejected, (state) => {
    state.nodeIsReady.isFetching = false;
  });
  builder.addCase(isNodeReadyThunk.fulfilled, (state, action) => {
    // console.log('isNodeReadyThunk', action.payload);
    if (action.payload) {
      state.nodeIsReady.data = action.payload;
    }
    state.nodeIsReady.isFetching = true;
  });
  // getInfo
  builder.addCase(getInfoThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      state.info.data = action.payload;
    }
    state.info.isFetching = false;
  });
  builder.addCase(getInfoThunk.rejected, (state) => {
    state.info.isFetching = false;
  });
  // getAddresses
  builder.addCase(getAddressesThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      state.addresses.data = action.payload;
    }
    state.addresses.isFetching = false;
  });
  builder.addCase(getAddressesThunk.rejected, (state) => {
    state.addresses.isFetching = false;
  });
  // getBalances
  builder.addCase(getBalancesThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      state.balances.data = {
        native: {
          value: parseEther(action.payload.native).toString(),
          formatted: action.payload.native,
        },
        hopr: {
          value: parseEther(action.payload.hopr).toString(),
          formatted: action.payload.hopr,
        },
        safeHopr: {
          value: parseEther(action.payload.safeHopr).toString(),
          formatted: action.payload.safeHopr,
        },
        safeNative: {
          value: parseEther(action.payload.safeNative).toString(),
          formatted: action.payload.safeNative,
        },
        safeHoprAllowance: {
          value: parseEther(action.payload.safeHoprAllowance).toString(),
          formatted: action.payload.safeHoprAllowance,
        },
        channels: {
          value: state.balances.data.channels.value,
          formatted: state.balances.data.channels.formatted,
        },
      };
      if (!state.balances.alreadyFetched) state.balances.alreadyFetched = true;
      state.balances.isFetching = false;
    }
  });
  builder.addCase(getBalancesThunk.rejected, (state) => {
    state.balances.isFetching = false;
  });
  // getChannels
  builder.addCase(getChannelsThunk.pending, (state, action) => {
    state.channels.isFetching = true;
  });
  builder.addCase(getChannelsThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      console.log('getChannelsThunk', action.payload);
      state.channels.data = action.payload;
      if (action.payload.outgoing.length > 0) {
        let balance = BigInt(0);
        action.payload.outgoing.forEach((channel) => (balance += parseEther(channel.balance)));
        state.balances.data.channels = {
          value: balance.toString(),
          formatted: formatEther(balance),
        };
      } else {
        state.balances.data.channels = {
          value: '0',
          formatted: '0',
        };
      }

      // Parse the data

      // Save isClosing status
      const areClosingOutgoing = [];
      const areClosingIncoming = [];
      const outgoingIds = Object.keys(state.channels.parsed.outgoing);
      const incomingIds = Object.keys(state.channels.parsed.incoming);
      for (let i = 0; i < outgoingIds.length; i++) {
        const channelId = outgoingIds[i];
        if (state.channels.parsed.outgoing[channelId].isClosing) {
          areClosingOutgoing.push(channelId);
        }
      }
      for (let i = 0; i < incomingIds.length; i++) {
        const channelId = incomingIds[i];
        if (state.channels.parsed.incoming[channelId].isClosing) {
          areClosingIncoming.push(channelId);
        }
      }

      // Clean store to make sure that removed channels do not stay here
      state.channels.parsed.outgoing = {};
      state.links.nodeAddressToOutgoingChannel = {};

      // Regenerate channels
      for (let i = 0; i < action.payload.outgoing.length; i++) {
        const channelId = action.payload.outgoing[i].id;
        const nodeAddress = action.payload.outgoing[i].peerAddress;
        state.links.nodeAddressToOutgoingChannel[nodeAddress] = channelId;

        if (!state.channels.parsed.outgoing[channelId]) {
          state.channels.parsed.outgoing[channelId] = {
            balance: action.payload.outgoing[i].balance,
            peerAddress: nodeAddress,
            status: action.payload.outgoing[i].status,
            isClosing: areClosingOutgoing.includes(channelId),
          };
        } else {
          state.channels.parsed.outgoing[channelId].balance = action.payload.outgoing[i].balance;
          state.channels.parsed.outgoing[channelId].peerAddress = nodeAddress;
          state.channels.parsed.outgoing[channelId].status = action.payload.outgoing[i].status;
          state.channels.parsed.outgoing[channelId].isClosing = areClosingOutgoing.includes(channelId);
        }
      }

      state.channels.parsed.incoming = {};
      for (let i = 0; i < action.payload.incoming.length; i++) {
        const channelId = action.payload.incoming[i].id;
        const nodeAddress = action.payload.incoming[i].peerAddress;
        state.links.nodeAddressToIncomingChannel[nodeAddress] = channelId;
        state.links.incomingChannelToNodeAddress[channelId] = nodeAddress;

        if (!state.channels.parsed.incoming[channelId]) {
          state.channels.parsed.incoming[channelId] = {
            balance: action.payload.incoming[i].balance,
            peerAddress: nodeAddress,
            status: action.payload.incoming[i].status,
            tickets: 0,
            ticketBalance: '0',
            isClosing: areClosingIncoming.includes(channelId),
          };
        } else {
          state.channels.parsed.incoming[channelId].balance = action.payload.incoming[i].balance;
          state.channels.parsed.incoming[channelId].peerAddress = nodeAddress;
          state.channels.parsed.incoming[channelId].status = action.payload.incoming[i].status;
          state.channels.parsed.incoming[channelId].isClosing = areClosingIncoming.includes(channelId);
        }
      }
    }

    if (!state.channels.alreadyFetched) state.channels.alreadyFetched = true;
    state.channels.isFetching = false;
  });
  builder.addCase(getChannelsThunk.rejected, (state) => {
    state.channels.isFetching = false;
  });
  //openChannel
  builder.addCase(openChannelThunk.pending, (state, action) => {
    const peerAddress = action.meta.arg.destination;
    if (!peerAddress) return;
    state.channels.parsed.outgoingOpening[peerAddress] = true;
  });
  builder.addCase(openChannelThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    const peerAddress = action.meta.arg.destination;
    if (!peerAddress) return;
    state.channels.parsed.outgoingOpening[peerAddress] = false;
  });
  builder.addCase(openChannelThunk.rejected, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    const peerAddress = action.meta.arg.destination;
    if (!peerAddress) return;
    state.channels.parsed.outgoingOpening[peerAddress] = false;
  });
  //closeChannel
  builder.addCase(closeChannelThunk.pending, (state, action) => {
    const channelId = action.meta.arg.channelId;
    if (state.channels.parsed.outgoing[channelId]) state.channels.parsed.outgoing[channelId].isClosing = true;
    if (state.channels.parsed.incoming[channelId]) state.channels.parsed.incoming[channelId].isClosing = true;
  });
  builder.addCase(closeChannelThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    const channelId = action.meta.arg.channelId;
    if (state.channels.parsed.outgoing[channelId]) state.channels.parsed.outgoing[channelId].isClosing = false;
    if (state.channels.parsed.incoming[channelId]) state.channels.parsed.incoming[channelId].isClosing = false;
  });
  builder.addCase(closeChannelThunk.rejected, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    const channelId = action.meta.arg.channelId;
    if (state.channels.parsed.outgoing[channelId]) state.channels.parsed.outgoing[channelId].isClosing = false;
    if (state.channels.parsed.incoming[channelId]) state.channels.parsed.incoming[channelId].isClosing = false;
  });
  //getConfiguration
  builder.addCase(getConfigurationThunk.pending, (state, action) => {
    state.configuration.isFetching = true;
  });
  builder.addCase(getConfigurationThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    // console.log('getConfigurationThunk', action);
    if (action.payload) {
      state.configuration.data = action.payload;
    }
    state.configuration.isFetching = false;
  });
  builder.addCase(getConfigurationThunk.rejected, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    state.configuration.isFetching = false;
  });
  // getPeers
  builder.addCase(getPeersThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      state.peers.data = {
        announced: [],
        connected: [],
      };
      state.peers.data = action.payload;
      const sortedConnectedPeers = action.payload?.connected.map((peer) => peer.address).sort();
      const sortedAnnouncedPeers = action.payload?.announced.map((peer) => peer.address).sort();
      state.peers.parsed.connectedSorted = sortedConnectedPeers || [];
      state.peers.parsed.announcedSorted = sortedAnnouncedPeers || [];
    }

    if (!state.peers.alreadyFetched) state.peers.alreadyFetched = true;
    state.peers.isFetching = false;
  });
  builder.addCase(getPeersThunk.rejected, (state) => {
    state.peers.isFetching = false;
  });
  // getPeer
  builder.addCase(getPeerInfoThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      state.peerInfo.data = action.payload;
    }
    state.peerInfo.isFetching = false;
  });
  builder.addCase(getPeerInfoThunk.rejected, (state) => {
    state.peerInfo.isFetching = false;
  });
  // redeemAllTicketsThunk
  builder.addCase(redeemAllTicketsThunk.fulfilled, (state) => {
    state.redeemAllTickets.isFetching = false;
    state.redeemAllTickets.error = undefined;
  });
  builder.addCase(redeemAllTicketsThunk.rejected, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    state.redeemAllTickets.isFetching = false;
    // Assign the error to the errors state
    state.redeemAllTickets.error = (
      action.payload as {
        status: string | undefined;
        error: string | undefined;
      }
    ).error;
  });
  // resetTicketStatisticsThunk
  builder.addCase(resetTicketStatisticsThunk.fulfilled, (state) => {
    if (!state.statistics.data) return;
    state.statistics.data.neglectedValue = '0';
    state.statistics.data.redeemedValue = '0';
    state.statistics.data.rejectedValue = '0';
    state.statistics.data.winningCount = 0;
    state.resetTicketStatistics.isFetching = false;
  });
  builder.addCase(resetTicketStatisticsThunk.rejected, (state) => {
    state.resetTicketStatistics.isFetching = false;
  });
  // getTokenThunk
  builder.addCase(getTokenThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      const tokenExists = state.tokens.data?.findIndex((token) => token.id === action.payload?.id);

      if (tokenExists) {
        state.tokens.data[tokenExists] = action.payload;
      } else {
        state.tokens.data.push(action.payload);
      }
    }
    state.tokens.isFetching = false;
  });
  builder.addCase(getTokenThunk.rejected, (state) => {
    state.tokens.isFetching = false;
  });
  // createToken
  builder.addCase(createTokenThunk.fulfilled, (state) => {
    state.tokens.isFetching = false;
  });
  builder.addCase(createTokenThunk.rejected, (state) => {
    state.tokens.isFetching = false;
  });
  // getEntryNodes
  builder.addCase(getEntryNodesThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      state.entryNodes.data = action.payload;
    }
    state.entryNodes.isFetching = false;
  });
  builder.addCase(getEntryNodesThunk.rejected, (state) => {
    state.entryNodes.isFetching = false;
  });
  // getVersion
  builder.addCase(getVersionThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      state.version.data = action.payload;
    }
    state.version.isFetching = false;
  });
  builder.addCase(getVersionThunk.rejected, (state) => {
    state.version.isFetching = false;
  });
  // withdraw
  builder.addCase(withdrawThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      state.transactions.data.push(action.payload);
    }
    state.transactions.isFetching = false;
  });
  builder.addCase(withdrawThunk.rejected, (state) => {
    state.transactions.isFetching = false;
  });
  // getTicketStatistics
  builder.addCase(getTicketStatisticsThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      state.statistics.data = action.payload;
    }
    state.statistics.isFetching = false;
  });
  builder.addCase(getTicketStatisticsThunk.rejected, (state) => {
    state.statistics.isFetching = false;
  });
  // pingNode
  builder.addCase(pingNodeThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      const pingExists = state.pings.findIndex((ping) => ping.peerId === action.payload?.peerId);

      if (!action.payload.peerId) return;

      if (pingExists) {
        state.pings[pingExists] = {
          latency: action.payload.latency,
          peerId: action.payload.peerId,
        };
      } else {
        state.pings.push({
          latency: action.payload.latency,
          peerId: action.payload.peerId,
        });
      }
    }
  });
  // deleteToken
  builder.addCase(deleteTokenThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload?.deleted) {
      state.tokens.data = state.tokens.data.filter((token) => token.id !== action.payload?.id);
    }
    state.tokens.isFetching = false;
  });
  builder.addCase(deleteTokenThunk.rejected, (state) => {
    state.tokens.isFetching = false;
  });
  // getPrometheusMetrics
  builder.addCase(getPrometheusMetricsThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    if (action.payload) {
      state.metrics.data.raw = action.payload;
      const jsonMetrics = parseMetrics(action.payload);
      state.metrics.data.parsed = jsonMetrics;
      state.metricsParsed.nodeSync = (jsonMetrics?.hopr_indexer_sync_progress?.data[0] as number) || null;

      // count tickets
      state.metricsParsed.tickets.incoming = {
        redeemed: {},
        unredeemed: {},
      };
      if (
        jsonMetrics?.hopr_tickets_incoming_statistics?.categories &&
        jsonMetrics?.hopr_tickets_incoming_statistics?.data
      ) {
        const categories = jsonMetrics.hopr_tickets_incoming_statistics.categories;
        const data = jsonMetrics?.hopr_tickets_incoming_statistics?.data;
        for (let i = 0; i < categories.length; i++) {
          const channel = categories[i]
            .match(/channel="0x[a-f0-9]+"/gi)[0]
            .replace(`channel="`, ``)
            .replace(`"`, ``);
          const statistic = categories[i]
            .match(/statistic="[a-z_]+"/g)[0]
            .replace(`statistic="`, ``)
            .replace(`"`, ``);
          const value = data[i];

          if (value) {
            if (statistic === 'unredeemed') {
              state.metricsParsed.tickets.incoming.unredeemed[channel] = {
                value: `${value}`,
                formatted: formatEther(BigInt(`${value}`)),
              };
            } else if (statistic === 'redeemed') {
              state.metricsParsed.tickets.incoming.redeemed[channel] = {
                value: `${value}`,
                formatted: formatEther(BigInt(`${value}`)),
              };
            }
          }
        }
      }

      // get checksum
      if (jsonMetrics?.hopr_indexer_block_number && jsonMetrics?.hopr_indexer_checksum) {
        try {
          const hopr_indexer_block_number = jsonMetrics.hopr_indexer_block_number?.data[0];
          const hopr_indexer_checksum = jsonMetrics.hopr_indexer_checksum?.data[0];
          const checksum = hopr_indexer_checksum.toString(16);

          state.metricsParsed.checksum = checksum;
          state.metricsParsed.blockNumber = hopr_indexer_block_number;
        } catch (e) {
          console.error('Error getting blockNumber and checksum');
        }
      }

      // indexer data source
      if (jsonMetrics?.hopr_indexer_data_source) {
        try {
          const hoprIndexerDataSourceIndex = jsonMetrics.hopr_indexer_data_source?.data.findIndex(
            (elem: number) => elem === 1,
          );
          const hoprIndexerDataSource = jsonMetrics.hopr_indexer_data_source?.categories[hoprIndexerDataSourceIndex];
          state.metricsParsed.indexerDataSource = hoprIndexerDataSource.replace('{source="', '').replace('"}', '');
        } catch (e) {
          console.error('Error getting node indexer data source');
        }
      }

      // nodeStartEpoch
      if (jsonMetrics?.hopr_start_time) {
        try {
          const nodeStartEpoch = jsonMetrics.hopr_start_time?.data[0];
          state.metricsParsed.nodeStartEpoch = nodeStartEpoch;
        } catch (e) {
          console.error('Error getting node startup epoch');
        }
      }
    }
    state.metrics.isFetching = false;
  });
  builder.addCase(getPrometheusMetricsThunk.rejected, (state) => {
    state.metrics.isFetching = false;
  });
  // redeemChannelTickets
  builder.addCase(redeemChannelTicketsThunk.fulfilled, (state) => {
    state.redeemAllTickets.isFetching = false;
  });
  builder.addCase(redeemChannelTicketsThunk.rejected, (state) => {
    state.redeemAllTickets.isFetching = false;
  });
  // getTicketPrice
  builder.addCase(getTicketPriceThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    state.ticketPrice.data = action.payload?.price || null;
    state.ticketPrice.isFetching = false;
  });
  builder.addCase(getTicketPriceThunk.rejected, (state) => {
    state.ticketPrice.isFetching = false;
  });
  // getMinimumNetworkProbability
  builder.addCase(getMinimumNetworkProbabilityThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    state.probability.data = action.payload?.probability || null;
    state.probability.isFetching = false;
  });
  builder.addCase(getMinimumNetworkProbabilityThunk.rejected, (state) => {
    state.probability.isFetching = false;
  });
  // getSessionsThunk
  builder.addCase(getSessionsThunk.fulfilled, (state, action) => {
    if (action.meta.arg.apiEndpoint !== state.apiEndpoint) return;
    state.sessions.data = action.payload || null;
    state.sessions.isFetching = false;
  });
  builder.addCase(getSessionsThunk.rejected, (state) => {
    state.sessions.isFetching = false;
  });
};

export const actionsAsync = {
  isNodeReadyThunk,
  getInfoThunk,
  getAddressesThunk,
  getBalancesThunk,
  getChannelsThunk,
  getConfigurationThunk,
  getPeersThunk,
  getPeerInfoThunk,
  getTicketStatisticsThunk,
  getTokenThunk,
  getPrometheusMetricsThunk,
  getEntryNodesThunk,
  getVersionThunk,
  withdrawThunk,
  closeChannelThunk,
  fundChannelThunk,
  openChannelThunk,
  openMultipleChannelsThunk,
  redeemChannelTicketsThunk,
  pingNodeThunk,
  redeemAllTicketsThunk,
  resetTicketStatisticsThunk,
  getTicketPriceThunk,
  getMinimumNetworkProbabilityThunk,
  getSessionsThunk,
  openSessionThunk,
  closeSessionThunk,
  createTokenThunk,
  deleteTokenThunk,
  isCurrentApiEndpointTheSame,
};
