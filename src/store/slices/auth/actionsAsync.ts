import { GetInfoResponseType, api, utils } from '@hoprnet/hopr-sdk';
import { ActionReducerMapBuilder, createAsyncThunk } from '@reduxjs/toolkit';
import { parseEther } from 'viem';
import { RootState, useAppSelector } from '../..';
import { nodeActionsAsync } from '../node';
import { initialState } from './initialState';
const { sdkApiError } = utils;
const { getInfo, getAddresses } = api;

export const loginThunk = createAsyncThunk<
  GetInfoResponseType | { force: boolean } | undefined,
  { apiToken: string; apiEndpoint: string; force?: boolean },
  { state: RootState; rejectValue: { data: string; type: 'API_ERROR' | 'NOT_ELIGIBLE_ERROR' | 'FETCH_ERROR' } }
>('auth/login', async (payload, { rejectWithValue, dispatch }) => {
  const { apiEndpoint, apiToken } = payload;
  try {
    const info = await getInfo({
      apiEndpoint: apiEndpoint,
      apiToken: apiToken,
    });
    if (!payload.force && !info.isEligible) {
      const e = new Error();
      e.name = 'NOT_ELIGIBLE_ERROR';
      e.message =
        'Not eligible on network registry. ' +
        'Join the waitlist and once approved, you can return to login.' +
        '\n\nFor now, keep an eye on the waitlist.';
      throw e;
    }

    return info;
  } catch (e) {
    if (e instanceof sdkApiError && e.hoprdErrorPayload?.status === 'UNAUTHORIZED') {
      return rejectWithValue({
        data: e.hoprdErrorPayload?.status ?? e.hoprdErrorPayload?.error,
        type: 'API_ERROR',
      });
    }

    if (payload.force) {
      return { force: true };
    }

    // not eligible error thrown above
    if (e instanceof Error && e.name === 'NOT_ELIGIBLE_ERROR') {
      return rejectWithValue({
        data: 'Unable to connect.\n\n' + e.message,
        type: 'NOT_ELIGIBLE_ERROR',
      });
    }

    // see if connecting error is due to low balance
    try {
      const addresses = await dispatch(
        nodeActionsAsync.getAddressesThunk({
          apiToken,
          apiEndpoint,
          force: true,
        }),
      ).unwrap();

      if (e instanceof sdkApiError && e.hoprdErrorPayload?.error?.includes('get_peer_multiaddresses')) {
        const nodeAddressIsAvailable = addresses?.native ? `\n\nNode Address: ${addresses.native}` : '';
        return rejectWithValue({
          data: 'You Node seems to be starting, wait a couple of minutes before accessing it.' + nodeAddressIsAvailable,
          type: 'API_ERROR',
        });
      }

      const nodeBalances = await dispatch(
        nodeActionsAsync.getBalancesThunk({
          apiEndpoint,
          apiToken,
          force: true,
        }),
      ).unwrap();

      const minimumNodeBalance = parseEther('0.001');

      if (nodeBalances?.native !== undefined && BigInt(nodeBalances.native) < minimumNodeBalance) {
        return rejectWithValue({
          data:
            'Unable to connect.\n\n' +
            `Your xDai balance seems to low to operate the node.\nPlease top up your node.\nAddress: ${addresses?.native}`,
          type: 'NOT_ELIGIBLE_ERROR',
        });
      }

      // stringify to make sure that
      // the error is serializable
      return rejectWithValue({
        data: 'Unknown error: ' + JSON.stringify(e),
        type: 'FETCH_ERROR',
      });
    } catch (unknownError) {
      // getting balance and addresses failed
      // no way to tell if the balance is low
      return rejectWithValue({
        data: 'Error fetching: ' + JSON.stringify(unknownError),
        type: 'FETCH_ERROR',
      });
    }
  }
});

export const createAsyncReducer = (builder: ActionReducerMapBuilder<typeof initialState>) => {
  builder.addCase(loginThunk.pending, (state) => {
    state.status.connecting = true;
    state.status.connected = false;
    state.status.error = null;
  });
  builder.addCase(loginThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.status.connecting = false;
      state.status.connected = true;
      state.status.error = null;
    }
  });
  builder.addCase(loginThunk.rejected, (state, meta) => {
    state.status.connecting = false;
    if (meta.payload) {
      state.status.error = {
        data: meta.payload.data,
        type: meta.payload.type,
      };
    } else {
      state.status.error = {
        data: 'Unable to connect.\n\n' + meta.error.message,
        type: 'FETCH_ERROR',
      };
    }
  });
};

export const actionsAsync = { loginThunk };
