import { useAppDispatch, useAppSelector } from '../../store';
import { useEffect, useRef, useState } from 'react';
import { actionsAsync } from '../../store/slices/node/actionsAsync';
import { exportToCsv } from '../../utils/helpers';
import { utils } from '@hoprnet/hopr-sdk';
const { sdkApiError } = utils;

// HOPR Components
import Section from '../../future-hopr-lib-components/Section';
import { SubpageTitle } from '../../components/SubpageTitle';
import IconButton from '../../future-hopr-lib-components/Button/IconButton';
import { SendMessageModal } from '../../components/Modal/node/SendMessageModal';
import RemoveAliasIcon from '../../future-hopr-lib-components/Icons/RemoveAlias';
import TablePro from '../../future-hopr-lib-components/Table/table-pro';
import PeersInfo from '../../future-hopr-lib-components/PeerInfo';

// Modals
import { PingModal } from '../../components/Modal/node/PingModal';
import { CreateAliasModal } from '../../components/Modal/node//AddAliasModal';
import { OpenChannelModal } from '../../components/Modal/node/OpenChannelModal';
import { FundChannelModal } from '../../components/Modal/node/FundChannelModal';
import { OpenSessionModal } from '../../components/Modal/node/OpenSessionModal';

//Mui
import GetAppIcon from '@mui/icons-material/GetApp';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';

function AliasesPage() {
  const dispatch = useAppDispatch();
  const peerId = useAppSelector((store) => store.node.addresses.data.hopr);
  const aliases = useAppSelector((store) => store.node.aliases.data);
  const peersObject = useAppSelector((store) => store.node.peers.parsed.connected);
  const aliasesFetching = useAppSelector((store) => store.node.aliases.isFetching);
  const hoprAddress = useAppSelector((store) => store.node.addresses.data.hopr);
  const myNodeAddress = useAppSelector((store) => store.node.addresses.data.native);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const peerIdToNodeAddressLink = useAppSelector((store) => store.node.links.peerIdToNodeAddress);
  const peerIdToAliasLink = useAppSelector((store) => store.node.links.peerIdToAlias);
  const peerIdsWithAliases = Object.keys(peerIdToAliasLink);
  const nodeAddressToOutgoingChannelLink = useAppSelector((store) => store.node.links.nodeAddressToOutgoingChannel);
  const [importSuccess, set_importSuccess] = useState(false);
  const [deleteSuccess, set_deleteSuccess] = useState(false);
  const [importErrors, set_importErrors] = useState<
    { status: string | undefined; error: string | undefined; alias: string }[]
  >([]);
  const [deleteErrors, set_deleteErrors] = useState<
    { status: string | undefined; error: string | undefined; alias: string }[]
  >([]);

  useEffect(() => {
    if (loginData.apiEndpoint) {
      dispatch(
        actionsAsync.getAliasesThunk({
          apiEndpoint: loginData.apiEndpoint,
          apiToken: loginData.apiToken ? loginData.apiToken : '',
        }),
      );
    }
  }, [loginData]);

  const handleRefresh = () => {
    if (loginData.apiEndpoint) {
      dispatch(
        actionsAsync.getAliasesThunk({
          apiEndpoint: loginData.apiEndpoint,
          apiToken: loginData.apiToken ? loginData.apiToken : '',
        }),
      );
    }
  };

  const getNodeAddressByPeerId = (peerId: string): string | undefined => {
    if (peerId === hoprAddress && typeof myNodeAddress === 'string') return myNodeAddress;
    return peerIdToNodeAddressLink[peerId];
  };

  const handleExport = () => {
    if (aliases) {
      exportToCsv(
        Object.keys(aliases).map((alias) => ({
          alias: alias,
          peerId: aliases[alias],
        })),
        'aliases.csv',
      );
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCSVUpload = async (parsedData: any[]) => {
    if (!loginData.apiEndpoint) return;
    for (const data of parsedData) {
      if (data.alias && data.peerId) {
        if (peerIdsWithAliases.includes(data.peerId)) {
          console.log(peerIdToAliasLink, data.peerId, peerIdToAliasLink[data.peerId]);
          await dispatch(
            actionsAsync.removeAliasThunk({
              alias: peerIdToAliasLink[data.peerId],
              apiEndpoint: loginData.apiEndpoint,
              apiToken: loginData.apiToken ? loginData.apiToken : '',
            }),
          );
        }

        await dispatch(
          actionsAsync.setAliasThunk({
            alias: String(data.alias),
            peerId: String(data.peerId),
            apiEndpoint: loginData.apiEndpoint,
            apiToken: loginData.apiToken ? loginData.apiToken : '',
          }),
        )
          .unwrap()
          .then(() => {
            set_importSuccess(true);
            set_importErrors([]);
          })
          .catch((e) => {
            set_importSuccess(false);
            set_importErrors([
              ...importErrors,
              {
                alias: String(data.alias),
                error: e.error,
                status: e.status,
              },
            ]);
          });
      }
    }
    dispatch(
      actionsAsync.getAliasesThunk({
        apiEndpoint: loginData.apiEndpoint,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
      }),
    );
  };

  const parsedTableData = Object.entries(aliases ?? {}).map(([alias, peerId], key) => {
    const peerAddress = getNodeAddressByPeerId(peerId);
    const lastSeenNumeric = peerId && peersObject[peerId]?.lastSeen;
    const lastSeen =
      (lastSeenNumeric as number) > 0
        ? new Date(lastSeenNumeric)
            .toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short',
            })
            .replace(', ', '\n')
        : 'Not seen';

    return {
      id: peerId,
      key: key.toString(),
      alias,
      node: (
        <PeersInfo
          peerId={peerId}
          nodeAddress={peerAddress ?? ''}
        />
      ),
      lastSeen: <span style={{ whiteSpace: 'break-spaces' }}>{peerId === hoprAddress ? '-' : lastSeen}</span>,
      peerId,
      peerAddress: peerAddress ?? '',
      actions: (
        <>
          <PingModal
            peerId={peerId}
            disabled={peerId === hoprAddress}
            tooltip={peerId === hoprAddress ? `You can't ping yourself` : undefined}
          />
          {peerAddress && nodeAddressToOutgoingChannelLink[peerAddress] ? (
            <FundChannelModal channelId={nodeAddressToOutgoingChannelLink[peerAddress]} />
          ) : (
            <OpenChannelModal
              peerAddress={peerAddress}
              disabled={peerId === hoprAddress}
              tooltip={peerId === hoprAddress ? `You can't open a channel to yourself` : undefined}
            />
          )}
          <OpenSessionModal peerId={peerId} />
          <SendMessageModal peerId={peerId} />
          <DeleteAliasButton
            onSuccess={() => {
              set_deleteSuccess(true);
            }}
            onError={(e) => {
              set_deleteSuccess(false);
              set_deleteErrors([
                ...deleteErrors,
                {
                  alias: String(alias),
                  error: e.hoprdErrorPayload?.error,
                  status: e.hoprdErrorPayload?.status,
                },
              ]);
            }}
            alias={alias}
            disabled={peerId === hoprAddress}
            tooltip={peerId === hoprAddress ? `You can't remove this alias` : undefined}
          />
        </>
      ),
    };
  });

  const header = [
    {
      key: 'alias',
      name: 'Alias',
      search: true,
      hidden: true,
    },
    {
      key: 'node',
      name: 'Node',
      maxWidth: '350px',
    },
    {
      key: 'lastSeen',
      name: 'Last Seen',
      maxWidth: '20px',
    },
    {
      key: 'peerId',
      name: 'Peer Id',
      search: true,
      hidden: true,
    },
    {
      key: 'peerAddress',
      name: 'Node Address',
      search: true,
      maxWidth: '60px',
      hidden: true,
    },
    {
      key: 'actions',
      name: 'Actions',
      search: false,
      width: '190px',
      maxWidth: '190px',
    },
  ];

  return (
    <Section
      className="Section--aliases"
      id="Section--aliases"
      fullHeightMin
      yellow
    >
      <SubpageTitle
        title={`ALIASES (${parsedTableData.length})`}
        refreshFunction={handleRefresh}
        reloading={aliasesFetching}
        actions={
          <>
            <CreateAliasModal handleRefresh={handleRefresh} />
            <CSVUploader onParse={handleCSVUpload} />
            <IconButton
              iconComponent={<GetAppIcon />}
              tooltipText={
                <span>
                  EXPORT
                  <br />
                  aliases as a CSV
                </span>
              }
              disabled={aliases !== null && Object.keys(aliases).length === 0}
              onClick={handleExport}
            />
          </>
        }
      />
      <TablePro
        data={parsedTableData}
        search={true}
        id={'node-aliases-table'}
        header={header}
        loading={parsedTableData.length === 0 && aliasesFetching}
        orderByDefault="alias"
      />
    </Section>
  );
}

function DeleteAliasButton({
  alias,
  onError,
  onSuccess,
  disabled,
  tooltip,
}: {
  alias: string;
  onError: (e: typeof sdkApiError.prototype) => void;
  onSuccess: () => void;
  disabled?: boolean;
  tooltip?: string;
}) {
  const dispatch = useAppDispatch();
  const loginData = useAppSelector((store) => store.auth.loginData);

  return (
    <IconButton
      iconComponent={<RemoveAliasIcon />}
      aria-label="delete alias"
      tooltipText={
        tooltip ? (
          tooltip
        ) : (
          <span>
            DELETE
            <br />
            alias
          </span>
        )
      }
      onClick={() => {
        if (loginData.apiEndpoint) {
          dispatch(
            actionsAsync.removeAliasThunk({
              alias,
              apiEndpoint: loginData.apiEndpoint,
              apiToken: loginData.apiToken ? loginData.apiToken : '',
            }),
          )
            .unwrap()
            .then(() => {
              onSuccess();
            })
            .catch((e) => onError(e));
        }
      }}
      disabled={disabled}
    />
  );
}

function CreateAliasForm() {
  const dispatch = useAppDispatch();
  const loginData = useAppSelector((store) => store.auth.loginData);
  const [error, set_error] = useState<{
    status: string | undefined;
    error: string | undefined;
  }>();
  const [success, set_success] = useState(false);
  const [form, set_form] = useState<{ peerId: string; alias: string }>({
    alias: '',
    peerId: '',
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    set_form({
      ...form,
      [name]: value,
    });
  };

  return (
    <div>
      <input
        type="text"
        name="peerId"
        placeholder="peerId"
        onChange={handleChange}
        value={form.peerId}
      />
      <input
        type="text"
        name="alias"
        placeholder="alias"
        onChange={handleChange}
        value={form.alias}
      />
      <button
        disabled={form.alias.length === 0 || form.peerId.length === 0}
        onClick={() => {
          if (loginData.apiEndpoint) {
            dispatch(
              actionsAsync.setAliasThunk({
                alias: form.alias,
                peerId: form.peerId,
                apiEndpoint: loginData.apiEndpoint,
                apiToken: loginData.apiToken ? loginData.apiToken : '',
              }),
            )
              .unwrap()
              .then(() => {
                set_success(true);
                set_error(undefined);
              })
              .catch((e) => {
                set_success(false);
                set_error({
                  error: e.error,
                  status: e.status,
                });
              });
          }
        }}
      >
        add
      </button>
      <p>{success ? 'created alias!' : error?.status}</p>
    </div>
  );
}

/**
 * Represents the expected structure of the parsed data.
 */
type ParsedData = {
  [key: string]: string | number;
};

/**
 * Props for the CSVUploader component.
 */
type CSVUploaderProps<T extends ParsedData> = {
  /**
   * Callback function called when the CSV data is successfully parsed.
   * @param data The parsed data as an array of objects.
   */
  onParse: (data: T[]) => void;
};

/**
 * Component for uploading and parsing CSV data.
 */
function CSVUploader<T extends ParsedData>({ onParse }: CSVUploaderProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles the file upload event.
   * @param event The file upload event.
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const contents = e.target?.result;
      if (typeof contents === 'string') {
        parseCSV(contents);
      }
    };

    if (file) {
      reader.readAsText(file);
    }
  };

  /**
   * Parses the CSV content.
   * @param csvContent The content of the CSV file.
   */
  const parseCSV = (csvContent: string) => {
    const lines = csvContent.split('\n');
    const parsedData: T[] = [];

    // gets all keys, csv hold the headers on the first line
    const header = lines[0].split(',');
    const expectedObjectKeys = header.map((key) => key.trim());

    // loop through each line, get the values and assign the value to the key
    // then push the object to array parsedData
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length > 1) {
        const dataObject: T = {} as T;

        for (let j = 0; j < header.length; j++) {
          const key = expectedObjectKeys[j];
          const value = values[j]?.trim().replaceAll(' ', '_');
          if (expectedObjectKeys.includes(key)) {
            dataObject[key as keyof T] = value as T[keyof T];
          }
        }

        parsedData.push(dataObject);
      }
    }

    // after parsing run callback function
    onParse(parsedData);

    // Reset the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <IconButton
        iconComponent={<DriveFolderUploadIcon />}
        tooltipText={
          <span>
            IMPORT
            <br />
            aliases from a CSV
          </span>
        }
        onClick={handleImportClick}
      />

      {/* hidden import */}
      <input
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileUpload}
        placeholder="import"
      />
    </div>
  );
}

export default AliasesPage;
