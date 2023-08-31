import { ActionReducerMapBuilder, createAsyncThunk } from '@reduxjs/toolkit';
import { WalletClient, publicActions } from 'viem';
import { RootState } from '../..';
import { GNOSIS_CHAIN_HOPR_BOOST_NFT, STAKE_SUBGRAPH } from '../../../../config';
import erc721ABI from '../../../abi/erc721-abi.json';
import { initialState } from './initialState';
import { web3Actions } from '.';
import { safeActions } from '../safe';

const getCommunityNftsOwnedByWallet = createAsyncThunk(
  'web3/getCommunityNftsOwnedByWallet',
  async (payload: { account: string }, { rejectWithValue }) => {
    try {
      const account = payload.account;
      const response = await fetch(STAKE_SUBGRAPH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // eslint-disable-next-line no-useless-escape
        body: `{\"query\":\"\\n  query getSubGraphNFTsUserDataForWallet {\\n    _meta {\\n      block {\\n        timestamp\\n        number\\n      }\\n    }\\n    boosts(first: 1, where: {owner: \\\"${account.toLocaleLowerCase()}\\\", uri_ends_with: \\\"Network_registry/community\\\"}) {\\n      id}\\n  }\\n\"}`,
      });
      const responseJson: {
        data: {
          boosts: { id: string }[];
        } | null;
      } = await response.json();

      return responseJson.data;
    } catch (e) {
      return rejectWithValue(e);
    }
  },
);

const sendNftToSafeThunk = createAsyncThunk<
  | {
      success: boolean;
    }
  | undefined,
  {
    walletClient: WalletClient;
    walletAddress: string;
    safeAddress: string;
    communityNftId: number;
  },
  { state: RootState }
>(
  'safe/sendNftToSafe',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(web3Actions.setCommunityNftTransferring(true));
    const success = false;
    try {
      const superWalletClient = payload.walletClient.extend(publicActions);

      if (!superWalletClient.account) return;

      const { request } = await superWalletClient.simulateContract({
        account: payload.walletClient.account,
        address: GNOSIS_CHAIN_HOPR_BOOST_NFT,
        abi: erc721ABI,
        functionName: 'safeTransferFrom',
        args: [payload.walletAddress, payload.safeAddress, payload.communityNftId],
      });

      const transactionHash = await superWalletClient.writeContract(request);

      await superWalletClient.waitForTransactionReceipt({ hash: transactionHash });

      dispatch(safeActions.setCommunityNftId(payload.communityNftId));

      return { success };
    } catch (e) {
      return rejectWithValue(e);
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().web3.communityNftTransferring;
    if (isFetching) {
      return false;
    }
  } },
);

export const createAsyncReducer = (builder: ActionReducerMapBuilder<typeof initialState>) => {
  builder.addCase(getCommunityNftsOwnedByWallet.fulfilled, (state, action) => {
    if (action.payload) {
      if (action.payload?.boosts.length > 0 && action.payload?.boosts[0].id) {
        state.communityNftId = parseInt(action.payload?.boosts[0].id);
      } else {
        state.communityNftId = null;
      }
    }
  });
  builder.addCase(sendNftToSafeThunk.rejected, (state) => {
    state.communityNftTransferring = false;
  });
  builder.addCase(sendNftToSafeThunk.fulfilled, (state) => {
    state.communityNftId = null;
    state.communityNftTransferring = false;
  });
};

export const actionsAsync = {
  getCommunityNftsOwnedByWallet,
  sendNftToSafeThunk,
};
