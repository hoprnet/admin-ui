import { ActionReducerMapBuilder, createAsyncThunk, isPlain } from '@reduxjs/toolkit';
import SafeApiKit, {
  AddSafeDelegateProps,
  AllTransactionsListResponse,
  AllTransactionsOptions,
  DeleteSafeDelegateProps,
  GetSafeDelegateProps,
  OwnerResponse,
  SafeDelegateListResponse,
  SafeDelegateResponse,
  SafeInfoResponse,
  SafeMultisigTransactionListResponse,
  SignatureResponse,
  TokenInfoListResponse,
  TokenInfoResponse
} from '@safe-global/api-kit';
import Safe, { EthersAdapter, SafeAccountConfig, SafeFactory } from '@safe-global/protocol-kit';
import { SafeMultisigTransactionResponse, SafeTransaction, SafeTransactionData, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import { ethers } from 'ethers';
import {
  Address,
  WalletClient,
  encodePacked,
  keccak256,
  publicActions,
  toBytes,
  toHex
} from 'viem'
import { RootState } from '../..';
import {
  HOPR_CHANNELS_SMART_CONTRACT_ADDRESS,
  HOPR_NODE_MANAGEMENT_MODULE,
  HOPR_NODE_STAKE_FACTORY,
  SAFE_SERVICE_URL,
  STAKE_SUBGRAPH
} from '../../../../config';
import hoprNodeStakeFactoryAbi from '../../../abi/nodeStakeFactoryAbi.json';
import {
  getCurrencyFromHistoryTransaction,
  getRequestFromHistoryTransaction,
  getRequestOfPendingTransaction,
  getSourceFromHistoryTransaction,
  getSourceOfPendingTransaction,
  getValueFromHistoryTransaction
} from '../../../utils/safeTransactions';
import { stakingHubActions } from '../stakingHub';
import { safeActionsFetching } from './actionsFetching';
import { initialState } from './initialState';

const createSafeApiService = async (signer: ethers.providers.JsonRpcSigner) => {
  const adapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });
  const safeService = new SafeApiKit({
    txServiceUrl: SAFE_SERVICE_URL,
    ethAdapter: adapter,
  });

  return safeService;
};

const createSafeSDK = async (signer: ethers.providers.JsonRpcSigner, safeAddress: string) => {
  const sdkAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeAccount = await Safe.create({
    ethAdapter: sdkAdapter,
    safeAddress: safeAddress,
  });

  return safeAccount;
};

const createSafeFactory = async (signer: ethers.providers.JsonRpcSigner) => {
  const adapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeFactory = await SafeFactory.create({
    ethAdapter: adapter,
    safeVersion: '1.4.1',
  });

  return safeFactory;
};

const createVanillaSafeWithConfigThunk = createAsyncThunk<
  string | undefined,
  {
    signer: ethers.providers.JsonRpcSigner;
    config: SafeAccountConfig;
  },
  { state: RootState }
>(
  'safe/createVanillaSafeWithConfig',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setSelectedSafeFetching(true));
    try {
      const safeFactory = await createSafeFactory(payload.signer);

      // The saltNonce is used to calculate a deterministic address for the new Safe contract.
      // This way, even if the same Safe configuration is used multiple times,
      // each deployment will result in a new, unique Safe contract.
      const saltNonce = Date.now().toString();

      const safeAccount = await safeFactory.deploySafe({
        safeAccountConfig: payload.config,
        saltNonce,
      });

      const safeAddress = await safeAccount.getAddress();
      return safeAddress;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.selectedSafeAddress.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const getSafesByOwnerThunk = createAsyncThunk<
  OwnerResponse | undefined,
  { signer: ethers.providers.JsonRpcSigner },
  { state: RootState }
>(
  'safe/getSafesByOwner',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setSafeByOwnerFetching(true));
    try {
      const safeApi = await createSafeApiService(payload.signer);
      const signerAddress = await payload.signer.getAddress();
      const safeAddresses = await safeApi.getSafesByOwner(signerAddress);
      return safeAddresses;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.safesByOwner.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const addOwnerToSafeThunk = createAsyncThunk<
  SafeTransactionData | undefined,
  {
    signer: ethers.providers.JsonRpcSigner;
    safeAddress: string;
    ownerAddress: string;
    threshold?: number;
  },
  { state: RootState }
>(
  'safe/addOwnerToSafe',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setInfoFetching(true));
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const safeApi = await createSafeApiService(payload.signer);

      const addOwnerTx = await safeSDK.createAddOwnerTx({
        ownerAddress: payload.ownerAddress,
        threshold: payload.threshold,
      });
      const safeTxHash = await safeSDK.getTransactionHash(addOwnerTx);
      const signature = await safeSDK.signTypedData(addOwnerTx);
      const senderAddress = await payload.signer.getAddress();
      // propose safe transaction
      await safeApi.proposeTransaction({
        safeAddress: payload.safeAddress,
        safeTransactionData: addOwnerTx.data,
        safeTxHash,
        senderAddress,
        senderSignature: signature.data,
      });

      // re fetch all txs
      dispatch(
        getAllSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        }),
      );
      return addOwnerTx.data;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.info.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const removeOwnerFromSafeThunk = createAsyncThunk<
  SafeTransactionData | undefined,
  {
    signer: ethers.providers.JsonRpcSigner;
    safeAddress: string;
    ownerAddress: string;
    threshold?: number;
  },
  { state: RootState }
>(
  'safe/removeOwnerFromSafe',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setInfoFetching(true));
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const safeApi = await createSafeApiService(payload.signer);

      const removeOwnerTx = await safeSDK.createRemoveOwnerTx({
        ownerAddress: payload.ownerAddress,
        threshold: payload.threshold,
      });
      const safeTxHash = await safeSDK.getTransactionHash(removeOwnerTx);
      const signature = await safeSDK.signTypedData(removeOwnerTx);
      const senderAddress = await payload.signer.getAddress();
      // propose safe transaction
      await safeApi.proposeTransaction({
        safeAddress: payload.safeAddress,
        safeTransactionData: removeOwnerTx.data,
        safeTxHash,
        senderAddress,
        senderSignature: signature.data,
      });
      // re fetch all txs
      dispatch(
        getAllSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        }),
      );
      return removeOwnerTx.data;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.info.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const updateSafeThresholdThunk = createAsyncThunk<
  SafeTransactionData | undefined,
  {
    signer: ethers.providers.JsonRpcSigner;
    safeAddress: string;
    newThreshold: number;
  },
  { state: RootState }
>(
  'safe/updateSafeThreshold',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setInfoFetching(true));
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const safeApi = await createSafeApiService(payload.signer);
      // gets next nonce considering pending txs
      const nextSafeNonce = await safeApi.getNextNonce(payload.safeAddress);
      const changeThresholdTx = await safeSDK.createChangeThresholdTx(payload.newThreshold, { nonce: nextSafeNonce });
      const safeTxHash = await safeSDK.getTransactionHash(changeThresholdTx);
      const signature = await safeSDK.signTypedData(changeThresholdTx);
      const senderAddress = await payload.signer.getAddress();
      // propose safe transaction
      await safeApi.proposeTransaction({
        safeAddress: payload.safeAddress,
        safeTransactionData: changeThresholdTx.data,
        safeTxHash,
        senderAddress,
        senderSignature: signature.data,
      });
      // re fetch all txs
      dispatch(
        getPendingSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        }),
      );
      return changeThresholdTx.data;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.info.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const getSafeInfoThunk = createAsyncThunk<
  SafeInfoResponse,
  {
    signer: ethers.providers.JsonRpcSigner;
    safeAddress: string;
  },
  { state: RootState }
>(
  'safe/getSafeInfo',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setInfoFetching(true));
    try {
      const safeApi = await createSafeApiService(payload.signer);
      const info = await safeApi.getSafeInfo(payload.safeAddress);
      return info;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.info.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const createSafeTransactionThunk = createAsyncThunk<
  string | undefined,
  { signer: ethers.providers.JsonRpcSigner; safeAddress: string; safeTransactionData: SafeTransactionDataPartial },
  { state: RootState }
>(
  'safe/createTransaction',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setCreateTransactionFetching(true));
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const safeApi = await createSafeApiService(payload.signer);
      // gets next nonce considering pending txs
      const nextSafeNonce = await safeApi.getNextNonce(payload.safeAddress);
      // create safe transaction
      const safeTransaction = await safeSDK.createTransaction({ safeTransactionData: {
        ...payload.safeTransactionData,
        nonce: nextSafeNonce,
      } });
      const safeTxHash = await safeSDK.getTransactionHash(safeTransaction);
      const signature = await safeSDK.signTypedData(safeTransaction);
      const senderAddress = await payload.signer.getAddress();
      // propose safe transaction
      await safeApi.proposeTransaction({
        safeAddress: payload.safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress,
        senderSignature: signature.data,
      });
      // re fetch all txs
      dispatch(
        getPendingSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        }),
      );
      return safeTxHash;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.createTransaction.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const createSafeContractTransaction = createAsyncThunk<
  string | undefined,
  { signer: ethers.providers.JsonRpcSigner; safeAddress: string; smartContractAddress: string; data: string },
  { state: RootState }
>(
  'safe/createContractTransaction',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    try {
      const {
        smartContractAddress,
        data,
        signer,
        safeAddress,
      } = payload;

      const safeTransactionData: SafeTransactionDataPartial = {
        to: smartContractAddress,
        data,
        value: '0',
      };
      const safeTxHash = await dispatch(
        createSafeTransactionThunk({
          signer,
          safeAddress: safeAddress,
          safeTransactionData,
        }),
      ).unwrap();

      return safeTxHash;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.createTransaction.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const createSafeRejectionTransactionThunk = createAsyncThunk<
  boolean | undefined,
  { signer: ethers.providers.JsonRpcSigner; safeAddress: string; nonce: number },
  { state: RootState }
>(
  'safe/rejectTransactionProposal',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setRejectTransactionFetching(true));
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const safeApi = await createSafeApiService(payload.signer);
      // create safe rejection transaction
      const rejectTransaction = await safeSDK.createRejectionTransaction(payload.nonce);
      const safeTxHash = await safeSDK.getTransactionHash(rejectTransaction);
      const signature = await safeSDK.signTypedData(rejectTransaction);
      const senderAddress = await payload.signer.getAddress();
      // propose safe transaction
      await safeApi.proposeTransaction({
        safeAddress: payload.safeAddress,
        safeTransactionData: rejectTransaction.data,
        safeTxHash,
        senderAddress,
        senderSignature: signature.data,
      });
      // re fetch all txs
      dispatch(
        getPendingSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        }),
      );
      return true;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.rejectTransaction.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const confirmTransactionThunk = createAsyncThunk<
  SignatureResponse | undefined,
  { signer: ethers.providers.JsonRpcSigner; safeAddress: string; safeTransactionHash: string },
  { state: RootState }
>(
  'safe/confirmTransactionProposal',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setConfirmTransactionFetching(true));
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const safeApi = await createSafeApiService(payload.signer);
      const signature = await safeSDK.signTransactionHash(payload.safeTransactionHash);
      const confirmTransaction = await safeApi.confirmTransaction(payload.safeTransactionHash, signature.data);
      // re fetch all txs
      dispatch(
        getPendingSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        }),
      );
      return confirmTransaction;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.confirmTransaction.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const executePendingTransactionThunk = createAsyncThunk<
  boolean | undefined,
  {
    signer: ethers.providers.JsonRpcSigner;
    safeAddress: string;
    safeTransaction: SafeMultisigTransactionResponse | SafeTransaction;
  },
  { state: RootState }
>(
  'safe/executeTransactionProposal',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setExecuteTransactionFetching(true));
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      await safeSDK.executeTransaction(payload.safeTransaction);
      // re fetch all txs
      dispatch(
        getPendingSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        }),
      );
      return true;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.executeTransaction.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

/**
 * Creates a safe transaction and executes, skips proposing.
 * This only works if the safe has threshold of 1
 */
const createAndExecuteTransactionThunk = createAsyncThunk<
  string,
  {
    signer: ethers.providers.JsonRpcSigner;
    safeAddress: string;
    safeTransactionData: SafeTransactionDataPartial;
  },
  {
    state: RootState;
  }
>(
  'safe/createAndExecuteTransaction',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setExecuteTransactionFetching(true));
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      // create safe transaction
      const safeTransaction = await safeSDK.createTransaction({ safeTransactionData: payload.safeTransactionData });
      const isValidTx = await safeSDK.isValidTransaction(safeTransaction);
      if (!isValidTx) {
        throw Error('Transaction is not valid');
      }
      // execute safe transaction
      const safeTxResponse = await safeSDK.executeTransaction(safeTransaction);
      // re fetch all txs
      dispatch(
        getAllSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        }),
      );
      return safeTxResponse.hash;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.executeTransaction.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const createAndExecuteContractTransactionThunk = createAsyncThunk<
  string,
  {
    signer: ethers.providers.JsonRpcSigner;
    safeAddress: string;
    smartContractAddress: string;
    data: string;
  },
  { state: RootState }
>('safe/createAndExecuteContractTransaction', async (payload, {
  rejectWithValue,
  dispatch,
}) => {
  try {
    const {
      smartContractAddress,
      data,
      signer,
      safeAddress,
    } = payload;

    const safeTransactionData: SafeTransactionDataPartial = {
      to: smartContractAddress,
      data,
      value: '0',
    };

    const safeTxResult = await dispatch(
      createAndExecuteTransactionThunk({
        signer,
        safeAddress: safeAddress,
        safeTransactionData,
      }),
    ).unwrap();

    return safeTxResult;
  } catch (e) {
    if (e instanceof Error) {
      return rejectWithValue(e.message);
    }

    // value is serializable
    if (isPlain(e)) {
      return rejectWithValue(e);
    }

    // error is not serializable
    return rejectWithValue(JSON.stringify(e));
  }
});

const getAllSafeTransactionsThunk = createAsyncThunk<
  AllTransactionsListResponse | undefined,
  {
    signer: ethers.providers.JsonRpcSigner;
    safeAddress: string;
    options?: AllTransactionsOptions;
  },
  { state: RootState }
>(
  'safe/getAllSafeTransactions',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setSafeAllTransactionsFetching(true));
    try {
      const safeApi = await createSafeApiService(payload.signer);
      const transactions = await safeApi.getAllTransactions(payload.safeAddress, {
        ...payload.options,
        executed: true,
      });
      return transactions;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.allTransactions.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const getPendingSafeTransactionsThunk = createAsyncThunk<
  SafeMultisigTransactionListResponse,
  {
    signer: ethers.providers.JsonRpcSigner;
    safeAddress: string;
  },
  { state: RootState }
>(
  'safe/getPendingSafeTransactions',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setSafePendingTransactionsFetching(true));
    try {
      const safeApi = await createSafeApiService(payload.signer);
      const transactions = await safeApi.getPendingTransactions(payload.safeAddress);
      return transactions;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.pendingTransactions.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const addSafeDelegateThunk = createAsyncThunk<
  SafeDelegateResponse | undefined,
  {
    options: Omit<AddSafeDelegateProps, 'signer'>;
    signer: ethers.providers.JsonRpcSigner;
  },
  { state: RootState }
>(
  'safe/addDelegate',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setAddDelegateFetching(true));
    try {
      const safeApi = await createSafeApiService(payload.signer);
      const response = await safeApi.addSafeDelegate({
        ...payload.options,
        signer: payload.signer,
      });

      // update delegate list
      dispatch(
        getSafeDelegatesThunk({
          signer: payload.signer,
          options: { ...payload.options },
        }),
      );

      return response;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.addDelegate.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const removeSafeDelegateThunk = createAsyncThunk<
  void | undefined,
  { options: Omit<DeleteSafeDelegateProps, 'signer'>; signer: ethers.providers.JsonRpcSigner },
  { state: RootState }
>(
  'safe/removeDelegate',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setRemoveDelegateFetching(true));
    try {
      const safeApi = await createSafeApiService(payload.signer);
      const response = await safeApi.removeSafeDelegate({
        ...payload.options,
        signer: payload.signer,
      });

      // update delegate list
      dispatch(
        getSafeDelegatesThunk({
          signer: payload.signer,
          options: { ...payload.options },
        }),
      );

      return response;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.removeDelegate.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const getSafeDelegatesThunk = createAsyncThunk<
  SafeDelegateListResponse | undefined,
  { options: GetSafeDelegateProps; signer: ethers.providers.JsonRpcSigner },
  { state: RootState }
>(
  'safe/getDelegates',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setSafeDelegatesFetching(true));
    try {
      const safeApi = await createSafeApiService(payload.signer);
      const response = await safeApi.getSafeDelegates(payload.options);
      return response;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.delegates.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const getToken = createAsyncThunk<
  TokenInfoResponse | undefined,
  {
    tokenAddress: string;
    signer: ethers.providers.JsonRpcSigner;
  },
  { state: RootState }
>(
  'safe/getToken',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setTokenFetching(true));
    try {
      const safeApi = await createSafeApiService(payload.signer);
      const token = await safeApi.getToken(payload.tokenAddress);
      return token;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.token.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const getTokenList = createAsyncThunk<
  TokenInfoListResponse | undefined,
  {
    signer: ethers.providers.JsonRpcSigner;
  },
  { state: RootState }
>(
  'safe/getTokenList',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setTokenListFetching(true));
    try {
      const safeApi = await createSafeApiService(payload.signer);
      const tokenList = await safeApi.getTokenList();
      return tokenList;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.tokenList.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

// SC staking functions

/**
 * Next version of create safe with HOPR_NODE_STAKE_FACTORY .clone
 * */
const createSafeWithConfigThunk = createAsyncThunk<
  | {
      transactionHash: string;
      moduleProxy: string;
      safeAddress: string;
    }
  | undefined,
  {
    walletClient: WalletClient;
    config: SafeAccountConfig;
  },
  { state: RootState }
>(
  'safe/createSafeWithConfig',
  async (payload, {
    rejectWithValue,
    dispatch,
  }) => {
    dispatch(safeActionsFetching.setSelectedSafeFetching(true));
    try {
      const superWalletClient = payload.walletClient.extend(publicActions);

      if (!superWalletClient.account) return;

      // The saltNonce is used to calculate a deterministic address for the new Safe contract.
      // This way, even if the same Safe configuration is used multiple times,
      // each deployment will result in a new, unique Safe contract.
      const saltNonce = keccak256(
        encodePacked(['bytes20', 'string'], [superWalletClient.account.address, Date.now().toString()]),
      );

      const {
        result,
        request,
      } = await superWalletClient.simulateContract({
        account: payload.walletClient.account,
        address: HOPR_NODE_STAKE_FACTORY,
        abi: hoprNodeStakeFactoryAbi,
        functionName: 'clone',
        args: [
          HOPR_NODE_MANAGEMENT_MODULE,
          payload.config.owners,
          saltNonce,
          toHex(new Uint8Array(toBytes(HOPR_CHANNELS_SMART_CONTRACT_ADDRESS)), { size: 32 }),
        ],
      });

      // TODO: Add error handling if failed (notificaiton)

      if (!result) return;

      const transactionHash = await superWalletClient.writeContract(request);

      await superWalletClient.waitForTransactionReceipt({ hash: transactionHash });

      const [moduleProxy, safeAddress] = result as [Address, Address];

      await fetch('https://stake.hoprnet.org/api/hub/generatedSafe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash,
          safeAddress,
          moduleAddress: moduleProxy,
          ownerAddress: payload.walletClient.account?.address,
        }),
      });

      dispatch(
        stakingHubActions.addSafeAndUseItForOnboarding({
          safeAddress,
          moduleAddress: moduleProxy,
        }),
      );

      return {
        transactionHash,
        moduleProxy,
        safeAddress,
      };
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  { condition: (_payload, { getState }) => {
    const isFetching = getState().safe.selectedSafeAddress.isFetching;
    if (isFetching) {
      return false;
    }
  } },
);

const getCommunityNftsOwnedBySafeThunk = createAsyncThunk(
  'web3/getCommunityNftsOwnedBySafe',
  async (account: string, { rejectWithValue }) => {
    try {
      const response = await fetch(STAKE_SUBGRAPH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // eslint-disable-next-line no-useless-escape
        body: `{\"query\":\"\\n  query getSubGraphNFTsUserDataForSafe {\\n    _meta {\\n      block {\\n        timestamp\\n        number\\n      }\\n    }\\n    boosts(first: 1, where: {owner: \\\"${account.toLocaleLowerCase()}\\\", uri_ends_with: \\\"Network_registry/community\\\"}) {\\n      id}\\n  }\\n\"}`,
      });
      const responseJson: {
        data: {
          boosts: { id: string }[];
        } | null;
      } = await response.json();

      return responseJson.data;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
);

export const createAsyncReducer = (builder: ActionReducerMapBuilder<typeof initialState>) => {
  // CreateSafeWithConfig
  builder.addCase(createSafeWithConfigThunk.fulfilled, (state, action) => {
    if (action.payload) {
      // reset other safe states
      state.allTransactions.data = null;
      state.communityNftId = null;
      state.delegates.data = null;
      state.pendingTransactions.data = null;
      state.info.data = null;
      state.selectedSafeAddress.data = action.payload.safeAddress;
    }
    state.selectedSafeAddress.isFetching = false;
  });
  builder.addCase(createSafeWithConfigThunk.rejected, (state) => {
    state.selectedSafeAddress.isFetching = false;
  });
  // CreateVanillaSafeWithConfig
  builder.addCase(createVanillaSafeWithConfigThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.selectedSafeAddress.data = action.payload;
    }
    state.selectedSafeAddress.isFetching = false;
  });
  builder.addCase(createVanillaSafeWithConfigThunk.rejected, (state) => {
    state.selectedSafeAddress.isFetching = false;
  });
  // GetSafesByOwner
  builder.addCase(getSafesByOwnerThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.safesByOwner.data = action.payload.safes;
    }
    state.safesByOwner.isFetching = false;
  });
  builder.addCase(getSafesByOwnerThunk.rejected, (state) => {
    state.safesByOwner.isFetching = false;
  });
  // AddOwnerToSafe
  builder.addCase(addOwnerToSafeThunk.fulfilled, (state) => {
    state.info.isFetching = false;
  });
  builder.addCase(addOwnerToSafeThunk.rejected, (state) => {
    state.info.isFetching = false;
  });
  // RemoveOwnerFromSafe
  builder.addCase(removeOwnerFromSafeThunk.fulfilled, (state) => {
    state.info.isFetching = false;
  });
  builder.addCase(removeOwnerFromSafeThunk.rejected, (state) => {
    state.info.isFetching = false;
  });
  // UpdateSafeThreshold
  builder.addCase(updateSafeThresholdThunk.fulfilled, (state) => {
    state.info.isFetching = false;
  });
  builder.addCase(updateSafeThresholdThunk.rejected, (state) => {
    state.info.isFetching = false;
  });
  // GetSafeInfo
  builder.addCase(getSafeInfoThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.info.data = action.payload;
    }
    state.selectedSafeAddress.isFetching = false;
  });
  builder.addCase(getSafeInfoThunk.rejected, (state) => {
    state.selectedSafeAddress.isFetching = false;
  });
  // CreateSafeTransaction
  builder.addCase(createSafeTransactionThunk.fulfilled, (state) => {
    state.createTransaction.isFetching = false;
  });
  builder.addCase(createSafeTransactionThunk.rejected, (state) => {
    state.createTransaction.isFetching = false;
  });
  // CreateSafeContractTransaction
  builder.addCase(createSafeContractTransaction.fulfilled, (state) => {
    state.createTransaction.isFetching = false;
  });
  builder.addCase(createSafeContractTransaction.rejected, (state) => {
    state.createTransaction.isFetching = false;
  });
  // CreateSafeRejectionTransaction
  builder.addCase(createSafeRejectionTransactionThunk.fulfilled, (state) => {
    state.rejectTransaction.isFetching = false;
  });
  builder.addCase(createSafeRejectionTransactionThunk.rejected, (state) => {
    state.createTransaction.isFetching = false;
  });
  // ConfirmTransaction
  builder.addCase(confirmTransactionThunk.fulfilled, (state) => {
    state.confirmTransaction.isFetching = false;
  });
  builder.addCase(confirmTransactionThunk.rejected, (state) => {
    state.confirmTransaction.isFetching = false;
  });
  // ExecuteTransaction
  builder.addCase(executePendingTransactionThunk.fulfilled, (state) => {
    state.executeTransaction.isFetching = false;
  });
  builder.addCase(executePendingTransactionThunk.rejected, (state) => {
    state.executeTransaction.isFetching = false;
  });
  // GetAllSafeTransactions
  builder.addCase(getAllSafeTransactionsThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.allTransactions.data = {
        ...action.payload,
        results: action.payload.results.map((result) => ({
          ...result,
          source: getSourceFromHistoryTransaction(result) ?? '',
          request: getRequestFromHistoryTransaction(result) ?? '',
          currency: getCurrencyFromHistoryTransaction(result) ?? '',
          value: getValueFromHistoryTransaction(result) ?? '',
        })),
      };
    }
    state.allTransactions.isFetching = false;
  });

  builder.addCase(getAllSafeTransactionsThunk.rejected, (state) => {
    state.allTransactions.isFetching = false;
  });
  // GetPendingSafeTransaction
  builder.addCase(getPendingSafeTransactionsThunk.fulfilled, (state, action) => {
    if (action.payload) {
      // add business logic: source, request
      state.pendingTransactions.data = {
        ...action.payload,
        results: action.payload.results.map((result) => ({
          ...result,
          source: getSourceOfPendingTransaction(result) ?? '',
          request: getRequestOfPendingTransaction(result) ?? '',
        })),
      };
    }
    state.pendingTransactions.isFetching = false;
  });
  builder.addCase(getPendingSafeTransactionsThunk.rejected, (state) => {
    state.pendingTransactions.isFetching = false;
  });
  // AddSafeDelegate
  builder.addCase(addSafeDelegateThunk.fulfilled, (state) => {
    state.addDelegate.isFetching = false;
  });
  builder.addCase(addSafeDelegateThunk.rejected, (state) => {
    state.addDelegate.isFetching = false;
  });
  // RemoveSafeDelegate
  builder.addCase(removeSafeDelegateThunk.fulfilled, (state) => {
    state.removeDelegate.isFetching = false;
  });
  builder.addCase(removeSafeDelegateThunk.rejected, (state) => {
    state.addDelegate.isFetching = false;
  });
  // GetSafeDelegates
  builder.addCase(getSafeDelegatesThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.delegates.data = action.payload;
    }
    state.delegates.isFetching = false;
  });
  builder.addCase(getSafeDelegatesThunk.rejected, (state) => {
    state.delegates.isFetching = false;
  });
  // GetTokenList
  builder.addCase(getTokenList.fulfilled, (state, action) => {
    if (action.payload) {
      state.tokenList.data = action.payload;
    }
    state.tokenList.isFetching = false;
  });
  builder.addCase(getTokenList.rejected, (state) => {
    state.tokenList.isFetching = false;
  });
  // GetToken
  builder.addCase(getToken.fulfilled, (state) => {
    state.token.isFetching = false;
  });
  builder.addCase(getToken.rejected, (state) => {
    state.token.isFetching = false;
  });
  builder.addCase(getCommunityNftsOwnedBySafeThunk.fulfilled, (state, action) => {
    if (action.payload) {
      if (action.payload?.boosts.length > 0 && action.payload?.boosts[0].id) {
        state.communityNftId = parseInt(action.payload?.boosts[0].id);
      }
    }
  });
};

export const actionsAsync = {
  createSafeWithConfigThunk,
  getSafesByOwnerThunk,
  addOwnerToSafeThunk,
  removeOwnerFromSafeThunk,
  getAllSafeTransactionsThunk,
  confirmTransactionThunk,
  createSafeRejectionTransactionThunk,
  createSafeTransactionThunk,
  getSafeInfoThunk,
  executePendingTransactionThunk,
  getPendingSafeTransactionsThunk,
  addSafeDelegateThunk,
  removeSafeDelegateThunk,
  getSafeDelegatesThunk,
  getToken,
  getTokenList,
  updateSafeThresholdThunk,
  createSafeContractTransaction,
  createAndExecuteTransactionThunk,
  createAndExecuteContractTransactionThunk,
  createVanillaSafeWithConfigThunk,
  getCommunityNftsOwnedBySafeThunk,
};
