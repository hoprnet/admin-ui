import { useEffect } from 'react';
import { formatDate } from '../../utils/date';

// Store
import { useAppDispatch, useAppSelector } from '../../store';
import { nodeActions } from '../../store/slices/node';
import { actionsAsync } from '../../store/slices/node/actionsAsync';

// HOPR components
import Section from '../../future-hopr-lib-components/Section';
import { SendMessageModal } from '../../components/Modal/node/SendMessageModal';
import { SubpageTitle } from '../../components/SubpageTitle';
import TablePro from '../../future-hopr-lib-components/Table/table-pro';
import IconButton from '../../future-hopr-lib-components/Button/IconButton';
import RemoveMessages from '../../future-hopr-lib-components/Icons/RemoveMessages';

const messages = () => {
  const messages = useAppSelector((store) => store.node.messages.data);
  const { apiEndpoint, apiToken } = useAppSelector((store) => store.auth.loginData);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!apiEndpoint) return;

    dispatch(
      actionsAsync.getAliasesThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      }),
    );
  }, []);

  const header = [
    {
      key: 'receivedAt',
      name: 'Timestamp',
      width: '120px',
      maxWidth: '120px',
    },
    {
      key: 'tag',
      name: 'Tag',
      search: true,
      width: '70px',
      maxWidth: '70px',
    },
    {
      key: 'body',
      name: 'Message',
      wrap: true,
      search: true,
    },
  ];

  const parsedTableData = messages.map((message) => {
    return {
      id: message.id,
      body: message.body,
      receivedAt: message.receivedAt ? formatDate(message.receivedAt) : '',
      tag: message.tag ? message.tag.toString() : '',
      actions: (
        <>
          {/* <button onClick={() => dispatch(nodeActions.toggleMessageSeen(message))}>
            Mark as {message.seen ? 'unseen' : 'seen'}
          </button> */}
        </>
      ),
    };
  });

  return (
    <Section
      fullHeightMin
      yellow
    >
      <SubpageTitle
        title={`MESSAGES (${messages.length})`}
        actions={
          <>
            <SendMessageModal />
            <IconButton
              iconComponent={<RemoveMessages />}
              tooltipText={
                <span>
                  REMOVE ALL
                  <br />
                  messages
                </span>
              }
              onClick={() => {
                if (!apiEndpoint) return;
                dispatch(
                  actionsAsync.deleteMessagesThunk({
                    apiEndpoint,
                    apiToken: apiToken ? apiToken : '',
                  }),
                );
              }}
            />
          </>
        }
      />
      <TablePro
        data={parsedTableData}
        id={'node-messages-table'}
        header={header}
        search
      />
    </Section>
  );
};

export default messages;
