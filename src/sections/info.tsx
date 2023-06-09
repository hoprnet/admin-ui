import { useAppDispatch, useAppSelector } from '../store';

// HOPR Components
import Section from '../future-hopr-lib-components/Section';
import { useEffect } from 'react';
import { actionsAsync } from '../store/slices/node/actionsAsync';

function InfoPage() {
  const dispatch = useAppDispatch();
  const { apiEndpoint, apiToken } = useAppSelector(
    (selector) => selector.auth.loginData
  );
  const balances = useAppSelector((selector) => selector.node.balances);
  const addresses = useAppSelector((selector) => selector.node.addresses);
  const channels = useAppSelector((selector) => selector.node.channels);
  const version = useAppSelector((selector) => selector.node.version);
  const info = useAppSelector((selector) => selector.node.info);
  const peers = useAppSelector((selector) => selector.node.peers);
  const aliases = useAppSelector((selector) => selector.node.aliases);
  const statistics = useAppSelector((selector) => selector.node.statistics);

  useEffect(() => {
    fetchInfoData();
  }, []);

  const fetchInfoData = () => {
    if (apiEndpoint && apiToken) {
      dispatch(actionsAsync.getBalancesThunk({ apiEndpoint, apiToken }));
      dispatch(actionsAsync.getChannelsThunk({ apiEndpoint, apiToken }));
      dispatch(actionsAsync.getAddressesThunk({ apiEndpoint, apiToken }));
      dispatch(actionsAsync.getVersionThunk({ apiEndpoint, apiToken }));
      dispatch(actionsAsync.getInfoThunk({ apiEndpoint, apiToken }));
      dispatch(actionsAsync.getPeersThunk({ apiEndpoint, apiToken }));
      dispatch(actionsAsync.getAliasesThunk({ apiEndpoint, apiToken }));
      dispatch(actionsAsync.getStatisticsThunk({ apiEndpoint, apiToken }));
    }
  };

  // check if user is logged in
  if (!apiEndpoint || !apiToken) {
    return (
      <Section className="Section--selectNode" id="Section--selectNode" yellow>
        Login to node
      </Section>
    );
  }

  return (
    <Section className="Section--selectNode" id="Section--selectNode" yellow>
      <h2>
        Info <button onClick={fetchInfoData}>refresh</button>{' '}
      </h2>
      <div id="info">
        <div id="version">Version: {version}</div>
        {!!info &&
          Object.entries(info).map(([key, value], index) => {
            if (Array.isArray(value)) {
              return (
                <div key={index}>
                  <h3>{key}</h3>
                  <ul>
                    {value.map((val, index) => (
                      <li key={index}>{val}</li>
                    ))}
                  </ul>
                </div>
              );
            }
            return (
              <div key={index}>
                {key}: {value}
              </div>
            );
          })}
      </div>
      <h2>Balances</h2>
      <div id="balances">
        <div>Native: {balances?.native}</div>
        <div>Hopr: {balances?.hopr}</div>
      </div>
      <h2>Addresses</h2>
      <div id="addresses">
        <div>Native: {addresses?.native}</div>
        <div>Hopr: {addresses?.hopr}</div>
      </div>
      <h2>Channels</h2>
      <div id="channels">
        <div>
          Incoming:{' '}
          {
            channels?.incoming.filter((channel) => channel.status === 'Open')
              .length
          }
        </div>
        <div>
          Outgoing:{' '}
          {
            channels?.outgoing.filter((channel) => channel.status === 'Open')
              .length
          }
        </div>
      </div>
      <h2>Peers</h2>
      <div id="peers">
        <div>Announced: {peers?.announced.length}</div>
        <div>Connected: {peers?.connected.length}</div>
      </div>
      <h2>Aliases</h2>
      <div id="aliases">
        <div>count: {Object.keys(aliases ?? {}).length}</div>
      </div>
      <h2>Statistics</h2>
      <div id="statistics">
        <div>
          {!!statistics &&
            Object.entries(statistics).map(([key, value], index) => {
              return (
                <div key={index}>
                  {key}: {value}
                </div>
              );
            })}
        </div>
      </div>
    </Section>
  );
}

export default InfoPage;
