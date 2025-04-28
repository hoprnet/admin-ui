import { useEffect, useState } from 'react';
import { nodeActionsAsync } from '../../store/slices/node';
import { useAppDispatch, useAppSelector } from '../../store';

// HOPR Components
import AbbreviatedPeerId from '../../components/AbbreviatedPeerId';
import Section from '../../future-hopr-lib-components/Section';
import TextField from '@mui/material/TextField';

function PingPage() {
  const dispatch = useAppDispatch();
  const [peerId, set_peerId] = useState('');
  const [pinging, set_pinging] = useState(false);
  const [pinged, set_pinged] = useState(false);
  const [invalidPeerId, set_invalidPeerId] = useState(false);

  const pings = useAppSelector((store) => store.node.pings);
  const aliases = useAppSelector((store) => store.node.aliases.data);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const { apiEndpoint, apiToken } = loginData;

  // Get aliases on page load
  useEffect(() => {
    if (!apiEndpoint) return;

    dispatch(
      nodeActionsAsync.getAliasesThunk({
        apiEndpoint,
        apiToken: apiToken ? apiToken : '',
      }),
    );
  }, []);

  const isAlias = (alias: string) => {
    if (aliases) {
      return !!aliases[alias];
    } else return false;
  };

  const validatePeerId = (peerId: string) => {
    if (aliases && isAlias(peerId)) {
      return aliases[peerId];
    }
    return peerId;
  };

  const handleClick = () => {
    if (apiEndpoint && apiToken && peerId !== '') {
      const validatedPeerId = validatePeerId(peerId);
      set_pinging(true); // Start pinging
      set_invalidPeerId(false); // Clear previous invalidPeerId state

      dispatch(
        nodeActionsAsync.pingNodeThunk({
          apiEndpoint,
          apiToken,
          peerId: validatedPeerId,
        }),
      )
        .unwrap()
        .then(() => {
          set_pinged(true); // Ping successful
          set_pinging(false); // Stop pinging
        })
        .catch(() => {
          set_pinged(false); // Ping failed
          set_pinging(false); // Stop pinging
          set_invalidPeerId(true); // Set invalidPeerId state
        });
    }
  };

  return (
    <Section fullHeightMin>
      <h2>PING</h2>
      <TextField
        type="text"
        label="Peer ID"
        placeholder="12D3Ko...Z3rz5F"
        value={peerId}
        onChange={(e) => set_peerId(e.target.value)}
        fullWidth
        required
      />
      <br />
      <button
        onClick={handleClick}
        disabled={!peerId}
      >
        Ping
      </button>
      {pinging && <p>Pinging...</p>}
      {!pinging &&
        pinged &&
        Object.values(pings).map((ping) => (
          <div key={ping.peerId}>
            <p>
              Ping to <AbbreviatedPeerId id={ping.peerId} />
            </p>
            <p>
              Pong from peer <AbbreviatedPeerId id={ping.peerId} /> received in {ping.latency} ms
            </p>
          </div>
        ))}
      {invalidPeerId && <p>Invalid Peer ID or Alias</p>}
    </Section>
  );
}

export default PingPage;
