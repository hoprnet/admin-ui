import { useAppSelector } from '../../store';
import styled from '@emotion/styled';
import { formatEther } from 'viem';
import Tooltip from '@mui/material/Tooltip';

interface Props {
  style?: object;
}

const Web3Container = styled.div`
  background-color: #cadeff;
  border-radius: 1rem;
  display: flex;
  gap: 8px;
  width: calc(190px + 2 * 8px);
  padding: 8px;
  font-size: 12px;
  /* margin-right: 8px; */
  box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14),
    0px 1px 3px 0px rgba(0, 0, 0, 0.12);
`;

const IconContainer = styled.div`
  height: 1rem;
  width: 1rem;
`;

const TitleColumn = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 38px;
  width: 100%;
  max-width: 78px;
  &.node {
    max-width: 112px;
  }
`;

const IconAndText = styled.div`
  align-items: center;
  display: flex;
  gap: 0.5rem;
`;

const Icon = styled.img`
  display: block;
  height: 1rem;
  width: 1rem;
`;

const Text = styled.p`
  font-weight: 600;
  &.noWrap {
    white-space: nowrap;
  }
`;

const DataColumn = styled.div<{ show?: boolean }>`
  visibility: ${(props) => (props.show === false ? 'hidden' : 'visible')};
  display: flex;
  flex-direction: column;
  width: 56px;
`;

const DataTitle = styled.p`
  text-transform: uppercase;
  font-weight: 600;
  margin-right: 5px;
  margin-bottom: 4px;
  margin-top: 20px;
`;

const Data = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #ddeaff;
  text-align: right;
  padding: 0 8px;
  width: calc(56px - 2 * 8px);
  border-radius: 1rem 1rem 1rem 1rem;
  flex-grow: 1;
  &.nodeOnly {
    width: 66px;
    margin-top: 40px;
  }
  p.double {
    line-height: 2.5;
  }
  p {
    text-overflow: ellipsis;
    overflow: hidden;
  }

  a {
    color: #007bff; /* Set the desired color for links */
    text-decoration: underline;
  }
`;

export const ColorStatus = styled.span`
  &.status-Green {
    color: #218520;
    font-weight: 700;
  }
  &.status-Orange {
    color: #ff8f00;
    font-weight: 700;
  }
  &.status-Red {
    color: #ff0000;
    font-weight: 700;
  }
`;

// TODO: make batter to work with balances
const truncateBalanceto5charsWhenNoDecimals = (value: string | number | undefined | null) => {
  try {
    if (value && BigInt(value)) {
      if (typeof value === 'string') value = parseInt(value);
      if (BigInt(value) > BigInt(1e9)) {
        return '1e9+';
      } else if (BigInt(value) >= BigInt(1e6)) {
        const tmp = (value / 1e6).toString();
        if (tmp.includes('.')) {
          const [before, after] = tmp.split('.');
          if (before.length === 3) return before + 'm';
          return `${before}.${after.substring(0, 1)}m`;
        } else {
          if (tmp.length === 3) return `${tmp}3m`;
          return `${tmp}.0m`;
        }
      } else if (BigInt(value) > BigInt(99999)) {
        const tmp = (value / 1e3).toString();
        if (tmp.includes('.')) {
          const [before, after] = tmp.split('.');
          if (before.length === 3) return before + 'k';
          return `${before}.${after.substring(0, 1)}k`;
        } else {
          if (tmp.length === 3) return `${tmp}k`;
          return `${tmp}.0k`;
        }
      }
      return value;
    }
  } catch (e) {
    console.warn('Error while paring data to BigInt for InfoBar');
  }
  return value;
};

export default function Details(props: Props) {
  const channels = useAppSelector((store) => store.node.channels.data);
  const peers = useAppSelector((store) => store.node.peers.data);
  const balances = useAppSelector((store) => store.node.balances.data);
  const info = useAppSelector((store) => store.node.info.data);
  const nodeConnected = useAppSelector((store) => store.auth.status.connected);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const statistics = useAppSelector((store) => store.node.statistics.data);

  const totalwxHOPR =
    balances.channels?.value && balances.safeHopr?.value
      ? formatEther(BigInt(balances.channels?.value) + BigInt(balances.safeHopr?.value))
      : '-';

  const isXdaiEnough = () => {
    if (balances.native.value && BigInt(balances.native.value) < BigInt('50000000000000000')) return 'Orange';
    else if (balances.native.value && BigInt(balances.native.value) < BigInt('1000000000000000')) return 'Red';
    return '';
  };

  return (
    <Web3Container style={props.style}>
      <TitleColumn className="node">
        <IconAndText>
          <IconContainer></IconContainer>
          <Text>Status</Text>
        </IconAndText>
        <IconAndText>
          <IconContainer>
            <Icon
              src="/assets/xDaiIcon.svg"
              alt="xDai Icon"
            />
          </IconContainer>
          <Text>xDAI: Node</Text>
        </IconAndText>
        <IconAndText>
          <IconContainer>
            <Icon
              src="/assets/wxHoprIcon.svg"
              alt="xDai Icon"
            />
          </IconContainer>
          <Text className="noWrap">wxHOPR: Safe</Text>
        </IconAndText>
        <IconAndText>
          <IconContainer>
            <Icon
              src="/assets/wxHoprIcon.svg"
              alt="xDai Icon"
            />
          </IconContainer>
          <Text>wxHOPR: Channels OUT</Text>
        </IconAndText>
        <IconAndText>
          <IconContainer>
            <Icon
              src="/assets/wxHoprIcon.svg"
              alt="xDai Icon"
            />
          </IconContainer>
          <Text>wxHOPR: Total</Text>
        </IconAndText>
        <IconAndText>
          <IconContainer></IconContainer>
          <Text>Unredeemed wxHOPR</Text>
        </IconAndText>
        <IconAndText>
          <IconContainer></IconContainer>
          <Text>Redeemed wxHOPR</Text>
        </IconAndText>
      </TitleColumn>
      <DataColumn>
        <Data className="nodeOnly">
          <p>
            <ColorStatus className={`status-${info?.connectivityStatus}`}>
              {info?.connectivityStatus ? info?.connectivityStatus : '-'}
            </ColorStatus>
          </p>
          <ColorStatus className={`status-${isXdaiEnough()}`}>
            <Tooltip
              title={
                balances.native?.formatted && balances.native?.formatted !== '0' ? balances.native?.formatted : null
              }
            >
              <p>{balances.native?.formatted ?? '-'}</p>
            </Tooltip>
          </ColorStatus>
          <Tooltip
            title={
              balances.safeHopr?.formatted && balances.safeHopr?.formatted !== '0' ? balances.safeHopr?.formatted : null
            }
          >
            <p>{balances.safeHopr?.formatted ?? '-'}</p>
          </Tooltip>
          <Tooltip
            title={
              balances.channels?.formatted && balances.channels?.formatted !== '0' ? balances.channels?.formatted : null
            }
          >
            <p className="double">{balances.channels?.formatted ?? '-'}</p>
          </Tooltip>
          <Tooltip title={totalwxHOPR && totalwxHOPR !== '0' ? totalwxHOPR : null}>
            <p className="double">{totalwxHOPR ?? '-'}</p>
          </Tooltip>
          <Tooltip
            title={
              statistics?.unredeemedValue && statistics?.unredeemedValue !== '0'
                ? formatEther(BigInt(statistics?.unredeemedValue as string))
                : null
            }
          >
            <p className="double">
              {statistics?.unredeemedValue ? formatEther(BigInt(statistics?.unredeemedValue as string)) : '-'}
            </p>
          </Tooltip>
          <Tooltip
            title={
              statistics?.redeemedValue && statistics?.redeemedValue !== '0'
                ? formatEther(BigInt(statistics?.redeemedValue as string))
                : null
            }
          >
            <p className="double">
              {statistics?.redeemedValue ? formatEther(BigInt(statistics?.redeemedValue as string)) : '-'}
            </p>
          </Tooltip>
        </Data>
      </DataColumn>
    </Web3Container>
  );
}
