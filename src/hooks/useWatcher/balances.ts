import { GetBalancesResponseType } from '@hoprnet/hopr-sdk';
import { useAppDispatch } from '../../store';
import { observeData } from './observeData';
import { nodeActionsAsync } from '../../store/slices/node';
import { sendNotification } from './notifications';
import { formatEther, parseEther } from 'viem';

/**
 * Checks if the new balance is greater than the previous balance.
 *
 * @param prevBalance The previous balance as a string.
 * @param newBalance The new balance as a string.
 * @returns A boolean indicating whether the new balance is greater than the previous balance.
 */
export const balanceHasIncreased = (prevBalance: string, newBalance: string) =>
  BigInt(prevBalance) < BigInt(newBalance);

/**
 * Handles balance notifications.
 *
 * @param newNodeBalances The new node balances of type GetBalancesResponseType.
 * @param prevNodeBalances The previous node balances of type GetBalancesResponseType, or null.
 * @param sendNewNativeBalanceNotification A function that handles new native balance notifications.
 * @param sendNewHoprBalanceNotification A function that handles new HOPR balance notifications.
 */
export const handleBalanceNotification = ({
  newNodeBalances,
  prevNodeBalances,
  minimumNodeBalances,
  sendNewNativeBalanceNotification,
  sendNativeBalanceTooLowNotification,
  sendNewNativeSafeBalanceNotification,
  sendNewHoprSafeBalanceNotification,
}: {
  prevNodeBalances: GetBalancesResponseType | null;
  newNodeBalances: GetBalancesResponseType;
  minimumNodeBalances: GetBalancesResponseType;
  sendNewNativeBalanceNotification: (nativeBalanceDifference: bigint) => void;
  sendNativeBalanceTooLowNotification: (newNativeBalance: bigint) => void;
  sendNewNativeSafeBalanceNotification: (nativeSafeBalanceDifference: bigint) => void;
  sendNewHoprSafeBalanceNotification: (hoprSafeBalanceDifference: bigint) => void;
}) => {
  if (parseEther(newNodeBalances.native) < parseEther(minimumNodeBalances.native)) {
    return sendNativeBalanceTooLowNotification(parseEther(newNodeBalances.native));
  }

  if (!prevNodeBalances) return;
  const nativeBalanceIsLarger = balanceHasIncreased(prevNodeBalances.native, newNodeBalances.native);
  if (nativeBalanceIsLarger) {
    const nativeBalanceDifference = parseEther(newNodeBalances.native) - parseEther(prevNodeBalances.native);
    sendNewNativeBalanceNotification(nativeBalanceDifference);
  }
  const nativeSafeBalanceIsLarger = balanceHasIncreased(prevNodeBalances.safeNative, newNodeBalances.safeNative);
  if (nativeSafeBalanceIsLarger) {
    const nativeSafeBalanceDifference =
      parseEther(newNodeBalances.safeNative) - parseEther(prevNodeBalances.safeNative);
    sendNewNativeSafeBalanceNotification(nativeSafeBalanceDifference);
  }

  const hoprSafeBalanceIsLarger = balanceHasIncreased(prevNodeBalances.safeHopr, newNodeBalances.safeHopr);
  if (hoprSafeBalanceIsLarger) {
    const hoprSafeBalanceDifference = parseEther(newNodeBalances.safeHopr) - parseEther(prevNodeBalances.safeHopr);
    sendNewHoprSafeBalanceNotification(hoprSafeBalanceDifference);
  }
};

/**
 * Observes node balances and handles notifications when changes are detected.
 *
 * @param previousState The previous state of type GetBalancesResponseType, or null.
 * @param apiToken The API token as a string, or null.
 * @param apiEndpoint The API endpoint as a string, or null.
 * @param updatePreviousData A function that updates the previous data with the current data.
 * @param dispatch The dispatch function returned by the useAppDispatch hook.
 */
export const observeNodeBalances = ({
  previousState,
  apiEndpoint,
  apiToken,
  active,
  minimumNodeBalances,
  updatePreviousData,
  dispatch,
}: {
  previousState: GetBalancesResponseType | null;
  apiToken: string | null;
  apiEndpoint: string | null;
  active: boolean;
  minimumNodeBalances: GetBalancesResponseType;
  updatePreviousData: (currentData: GetBalancesResponseType) => void;
  dispatch: ReturnType<typeof useAppDispatch>;
}) =>
  observeData<GetBalancesResponseType | null>({
    active: active && !!apiEndpoint,
    previousData: previousState,
    fetcher: async () => {
      if (!apiEndpoint) return;

      return await dispatch(
        nodeActionsAsync.getBalancesThunk({
          apiEndpoint,
          apiToken: apiToken ? apiToken : '',
        }),
      ).unwrap();
    },
    isDataDifferent: (newNodeBalances) => JSON.stringify(previousState) !== JSON.stringify(newNodeBalances),
    notificationHandler: (newNodeBalances) => {
      handleBalanceNotification({
        newNodeBalances,
        prevNodeBalances: previousState,
        minimumNodeBalances,
        sendNewNativeBalanceNotification: (nativeBalanceDifference) => {
          const message = `Node received ${formatEther(nativeBalanceDifference)} xDai`;
          sendNotification({
            notificationPayload: {
              source: 'node',
              name: message,
              url: null,
              timeout: null,
            },
            toastPayload: { message },
            dispatch,
          });
        },
        sendNativeBalanceTooLowNotification: (newNativeBalance) => {
          const message = `Node xDai level is low, node has ${formatEther(
            BigInt(newNativeBalance),
          )} and should have ${formatEther(BigInt(minimumNodeBalances.native))}`;
          sendNotification({
            notificationPayload: {
              source: 'node',
              name: message,
              url: null,
              timeout: null,
            },
            toastPayload: {
              message,
            },
            dispatch,
          });
        },
        sendNewHoprSafeBalanceNotification: (hoprSafeBalanceDifference) => {
          const message = `Safe received ${formatEther(hoprSafeBalanceDifference)} wxHopr`;
          sendNotification({
            notificationPayload: {
              source: 'safe',
              name: message,
              url: null,
              timeout: null,
            },
            toastPayload: { message },
            dispatch,
          });
        },
        sendNewNativeSafeBalanceNotification: (nativeSafeBalanceDifference) => {
          const message = `Safe received ${formatEther(nativeSafeBalanceDifference)} xDai`;
          sendNotification({
            notificationPayload: {
              source: 'safe',
              name: message,
              url: null,
              timeout: null,
            },
            toastPayload: { message },
            dispatch,
          });
        },
      });
    },
    updatePreviousData,
  });
