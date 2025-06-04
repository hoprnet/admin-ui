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
import RemoveAliasIcon from '../../future-hopr-lib-components/Icons/RemoveAlias';
import TablePro from '../../future-hopr-lib-components/Table/table-pro';
import PeersInfo from '../../future-hopr-lib-components/PeerInfo';

// Modals
import { PingModal } from '../../components/Modal/node/PingModal';
import { CreateAliasModal } from '../../components/Modal/node/AddAliasModal';
import { OpenChannelModal } from '../../components/Modal/node/OpenChannelModal';
import { FundChannelModal } from '../../components/Modal/node/FundChannelModal';
import { OpenSessionModal } from '../../components/Modal/node/OpenSessionModal';

//Mui
import GetAppIcon from '@mui/icons-material/GetApp';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import { nodeActions } from '../../store/slices/node';

function AliasesPage() {
  const dispatch = useAppDispatch();
  const aliases = useAppSelector((store) => store.node.aliases);
  const peersObject = useAppSelector((store) => store.node.peers.parsed.connected);
  const myNodeAddress = useAppSelector((store) => store.node.addresses.data.native);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const nodeAddressToOutgoingChannelLink = useAppSelector((store) => store.node.links.nodeAddressToOutgoingChannel);

  const handleExport = () => {
    if (aliases) {
      exportToCsv(
        Object.keys(aliases).map((address) => ({
          address,
          alias: aliases[address],
        })),
        `aliases-${myNodeAddress}.csv`,
      );
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCSVUpload = async (parsedData: any[]) => {
    if (!myNodeAddress) return;
    for (const data of parsedData) {
      dispatch(
        nodeActions.setAlias({
          nodeAddress: data.address || data.nodeAddress,
          alias: data.alias,
        }),
      );
    }
  };

  const parsedTableData = Object.keys(aliases ?? {}).map((nodeAddress, index) => {
    const alias = aliases[nodeAddress];
    const lastSeenNumeric = nodeAddress && peersObject[nodeAddress]?.lastSeen;
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
      id: nodeAddress,
      key: index.toString(),
      alias,
      node: <PeersInfo nodeAddress={nodeAddress} />,
      lastSeen: <span style={{ whiteSpace: 'break-spaces' }}>{myNodeAddress === nodeAddress ? '-' : lastSeen}</span>,
      nodeAddress: nodeAddress,
      actions: (
        <>
          <PingModal
            address={nodeAddress}
            disabled={nodeAddress === myNodeAddress}
            tooltip={nodeAddress === myNodeAddress ? `You can't ping yourself` : undefined}
          />
          <CreateAliasModal address={nodeAddress} />
          {nodeAddress && nodeAddressToOutgoingChannelLink[nodeAddress] ? (
            <FundChannelModal channelId={nodeAddressToOutgoingChannelLink[nodeAddress]} />
          ) : (
            <OpenChannelModal
              peerAddress={nodeAddress}
              disabled={nodeAddress === myNodeAddress}
              tooltip={nodeAddress === myNodeAddress ? `You can't open a channel to yourself` : undefined}
            />
          )}
          <OpenSessionModal destination={nodeAddress} />
          <IconButton
            iconComponent={<RemoveAliasIcon />}
            aria-label="delete alias"
            tooltipText={
              <span>
                DELETE
                <br />
                alias
              </span>
            }
            onClick={() => {
              dispatch(nodeActions.removeAlias(nodeAddress));
            }}
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
      key: 'nodeAddress',
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
        //  refreshFunction={handleRefresh}
        actions={
          <>
            <CreateAliasModal />
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
        // search={true}
        // id={'node-aliases-table'}
        header={header}
        // loading={parsedTableData.length === 0 && aliasesFetching}
        orderByDefault="alias"
      />
    </Section>
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
        onClick={() => {}}
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
