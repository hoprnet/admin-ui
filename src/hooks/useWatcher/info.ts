import { GetInfoResponseType } from '@hoprnet/hopr-sdk';
import { observeData } from './observeData';
import { sendNotification } from './notifications';
import { useAppDispatch } from '../../store';
import { nodeActionsAsync } from '../../store/slices/node';

/**
 * Observes Node Information and triggers a notification when there's a change in connectivity status.
 *
 * @param previousState The previous state of the node information.
 * @param apiToken The API token as a string, or null.
 * @param apiEndpoint The API endpoint as a string, or null.
 * @param updatePreviousData A function that updates the previous data with the current data.
 * @param dispatch The dispatch function returned by the useAppDispatch hook.
 */
export const observeNodeInfo = ({
  previousState,
  apiEndpoint,
  apiToken,
  updatePreviousData,
  dispatch,
}: {
  previousState: GetInfoResponseType | null;
  apiToken: string | null;
  apiEndpoint: string | null;
  updatePreviousData: (currentData: GetInfoResponseType) => void;
  dispatch: ReturnType<typeof useAppDispatch>;
}) =>
  observeData<GetInfoResponseType | null>({
    disabled: !apiEndpoint || !apiToken,
    fetcher: async () => {
      if (!apiEndpoint || !apiToken) return;
      return dispatch(
        nodeActionsAsync.getInfoThunk({
          apiEndpoint,
          apiToken,
        })
      ).unwrap();
    },
    previousData: previousState,
    isDataDifferent: (newNodeInfo) =>
      !!previousState && newNodeInfo.connectivityStatus !== previousState.connectivityStatus,
    notificationHandler: (newNodeInfo) => {
      sendNotification({
        notificationPayload: {
          name: `node connectivity status is now ${newNodeInfo?.connectivityStatus}`,
          source: 'node',
          url: null,
          timeout: null,
        },
        toastPayload: {
          message: `node connectivity status updated from ${previousState?.connectivityStatus} to ${newNodeInfo?.connectivityStatus}`,
        },
        dispatch,
      });
    },
    updatePreviousData,
  });
