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
  active,
  updatePreviousData,
  dispatch,
}: {
  previousState: GetInfoResponseType | null;
  apiToken: string | null;
  apiEndpoint: string | null;
  active: boolean;
  updatePreviousData: (currentData: GetInfoResponseType) => void;
  dispatch: ReturnType<typeof useAppDispatch>;
}) =>
  observeData<GetInfoResponseType | null>({
    active: active && !!apiEndpoint,
    fetcher: async () => {
      if (!apiEndpoint) return;
      return dispatch(
        nodeActionsAsync.getInfoThunk({
          apiEndpoint,
          apiToken: apiToken ? apiToken : '',
        }),
      ).unwrap();
    },
    previousData: previousState,
    isDataDifferent: (newNodeInfo) =>
      !!previousState && newNodeInfo.connectivityStatus !== previousState.connectivityStatus,
    notificationHandler: (newNodeInfo) => {
      const message = `Node connectivity status updated from ${previousState?.connectivityStatus} to ${newNodeInfo?.connectivityStatus}`;
      sendNotification({
        notificationPayload: {
          name: message,
          source: 'node',
          url: null,
          timeout: null,
        },
        toastPayload: {
          message,
        },
        dispatch,
      });
    },
    updatePreviousData,
  });
