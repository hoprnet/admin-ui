import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store';

import Row from './row';

function NodeUptime() {
  const nodeStartedEpoch = useAppSelector((store) => store.node.metrics.data.parsed?.hopr_start_time?.data[0]) as number;
  const [nodeTimeUp, set_nodeTimeUp] = useState(nodeStartedEpoch > 0 ? getUptime(nodeStartedEpoch) : '-');

  useEffect(() => {
    console.log('NodeUptime useEffect', nodeStartedEpoch);
    set_nodeTimeUp(getUptime(nodeStartedEpoch));
    let interval: any;
    interval = setInterval(() => {
      set_nodeTimeUp(getUptime(nodeStartedEpoch));
    }, 1_000);
    return () => clearInterval(interval);
  }, [nodeStartedEpoch]);

  function getUptime(nodeStartedEpoch: number) {
    if (nodeStartedEpoch && typeof nodeStartedEpoch === 'number') {
      const nodeStartedEpochMs = Math.floor(nodeStartedEpoch * 1000);
      const uptimeSec = Math.floor((Date.now() - nodeStartedEpochMs) / 1000);
      const days = Math.floor(uptimeSec / 86400);
      const hours = Math.floor((uptimeSec - days * 86400) / 3600);
      const minutes = Math.floor((uptimeSec - days * 86400 - hours * 3600) / 60);
      const seconds = Math.floor(uptimeSec - days * 86400 - hours * 3600 - minutes * 60);

      if (days !== 0) return `${days} days ${hours} hours ${minutes} min ${seconds} sec`;
      else if (hours !== 0) return `${hours} hours ${minutes} min ${seconds} sec`;
      else if (minutes !== 0) return `${minutes} min ${seconds} sec`;
      else return `${seconds} sec`;
    }
  }

  return (
    <Row
      title={'Uptime'}
      tooltip={'The amount of the node is up'}
      value={nodeTimeUp}
    />
  );
}

export default NodeUptime;
