import { useEffect, useState, KeyboardEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { formatEther } from 'viem';
import { rounder, rounder2 } from '../../utils/functions';

// HOPR Components
import { SubpageTitle } from '../../components/SubpageTitle';
import { TableExtended } from '../../future-hopr-lib-components/Table/columed-data';
import Section from '../../future-hopr-lib-components/Section';
import Button from '../../future-hopr-lib-components/Button';
import CodeCopyBox from '../../components/Code/CodeCopyBox';

// Mui
import { Paper, Switch } from '@mui/material';
import styled from '@emotion/styled';
import { appActions } from '../../store/slices/app';

const NotificationsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const DECIMALS_MULTIPLIER = BigInt(1e18); // For HOPR token's 18 decimals

interface StrategyConfig {
  path: ['AutoFunding' | 'AutoRedeeming', string];
  value: string;
}

const calculateTickets = (value: string, ticketPrice: string) => {
  console.log({ value, ticketPrice });
  const valueBigInt = BigInt(value);
  const ticketBigInt = BigInt(ticketPrice);
  return valueBigInt / ticketBigInt;
};

const updateStrategyString = (originalString: string, key: string, value: string, tickets: bigint): string => {
  const stringToReplace = `"${key}": "${value} HOPR"`;
  const formattedEther = formatEther(BigInt(value));
  const replacement = `"${key}": "${value}" // = ${formattedEther} wxHOPR (${rounder(Number(tickets))} tickets)`;

  return originalString.includes(stringToReplace + ',')
    ? originalString.replace(stringToReplace + ',', replacement + ',')
    : originalString.replace(stringToReplace, replacement);
};

function SettingsPage() {
  const dispatch = useAppDispatch();
  const prevNotificationSettings = useAppSelector((store) => store.app.configuration.notifications);
  const strategies = useAppSelector((store) => store.node.configuration.data?.hopr?.strategy);
  const configuration = useAppSelector((store) => store.node.configuration.data);
  const ticketPrice = useAppSelector((store) => store.node.ticketPrice.data);
  const [strategiesString, set_strategiesString] = useState<string | null>(null);
  const [configurationString, set_configurationString] = useState<string | null>(null);
  const [localNotificationSettings, set_localNotificationSettings] = useState<typeof prevNotificationSettings>();
  const canSave = !(
    localNotificationSettings?.channels === prevNotificationSettings.channels &&
    localNotificationSettings?.message === prevNotificationSettings.message &&
    localNotificationSettings?.nodeBalances === prevNotificationSettings.nodeBalances &&
    localNotificationSettings?.nodeInfo === prevNotificationSettings.nodeInfo &&
    localNotificationSettings?.pendingSafeTransaction === prevNotificationSettings.pendingSafeTransaction
  );

  useEffect(() => {
    window.addEventListener('keydown', handleEnter);
    return () => {
      window.removeEventListener('keydown', handleEnter);
    };
  }, [localNotificationSettings]);

  useEffect(() => {
    if (prevNotificationSettings) {
      set_localNotificationSettings(prevNotificationSettings);
    }
  }, [prevNotificationSettings]);

  // Usage in useEffect
  useEffect(() => {
    if (!strategies || !ticketPrice) return;

    try {
      const configs: StrategyConfig[] = [
        {
          path: ['AutoFunding', 'min_stake_threshold'],
          value: strategies.strategies?.AutoFunding?.min_stake_threshold?.replace(' HOPR', ''),
        },
        {
          path: ['AutoFunding', 'funding_amount'],
          value: strategies.strategies?.AutoFunding?.funding_amount?.replace(' HOPR', ''),
        },
        {
          path: ['AutoRedeeming', 'minimum_redeem_ticket_value'],
          value: strategies.strategies?.AutoRedeeming?.minimum_redeem_ticket_value?.replace(' HOPR', ''),
        },
        {
          path: ['AutoRedeeming', 'on_close_redeem_single_tickets_value_min'],
          value: strategies.strategies?.AutoRedeeming?.on_close_redeem_single_tickets_value_min?.replace(' HOPR', ''),
        },
      ];

      console.log('configs', configs);

      let result = JSON.stringify(strategies, null, 2);

      for (const config of configs) {
        if (config.value) {
          const tickets = calculateTickets(config.value, ticketPrice);
          result = updateStrategyString(result, config.path[1], config.value, tickets);
        }
      }

      set_strategiesString(result);
    } catch (e) {
      console.warn('Error while counting strategies against current ticket price.', e);
    }
  }, [strategies, ticketPrice]);

  useEffect(() => {
    if (configuration) {
      let tmp = JSON.parse(JSON.stringify(configuration));
      tmp.hopr['strategy'] && delete tmp.hopr['strategy'];
      tmp = JSON.stringify(tmp, null, 2);
      set_configurationString(tmp);
    }
  }, [configuration]);

  function handleSaveSettings() {
    if (localNotificationSettings) {
      dispatch(appActions.setNotificationSettings(localNotificationSettings));
    }
  }

  function handleEnter (event: KeyboardEvent) {
    if (canSave && event.key === 'Enter') {
      handleSaveSettings();
    }
  }

  return (
    <Section
      className="Section--settings"
      id="Section--settings"
      fullHeightMin
      yellow
    >
      <SubpageTitle title="CONFIGURATION" />
      <Paper
        style={{
          padding: '24px',
          width: 'calc( 100% - 48px )',
        }}
      >
        <TableExtended
          title="Node"
          style={{ marginBottom: '32px' }}
        >
          <tbody>
            <tr>
              <th>Notifications</th>
              <td>
                <NotificationsContainer>
                  <div>
                    Channels: False
                    <Switch
                      checked={localNotificationSettings?.channels}
                      onChange={() => {
                        console.log('localNotificationSettings', localNotificationSettings);
                        if (localNotificationSettings) {
                          set_localNotificationSettings({
                            ...localNotificationSettings,
                            channels: !localNotificationSettings.channels,
                          });
                        }
                      }}
                      color="primary"
                    />{' '}
                    True
                  </div>
                  <div>
                    Message: False
                    <Switch
                      checked={localNotificationSettings?.message}
                      onChange={() => {
                        if (localNotificationSettings) {
                          set_localNotificationSettings({
                            ...localNotificationSettings,
                            message: !localNotificationSettings.message,
                          });
                        }
                      }}
                      color="primary"
                    />{' '}
                    True
                  </div>
                  <div>
                    Node Balance: False
                    <Switch
                      checked={localNotificationSettings?.nodeBalances}
                      onChange={() => {
                        if (localNotificationSettings) {
                          set_localNotificationSettings({
                            ...localNotificationSettings,
                            nodeBalances: !localNotificationSettings.nodeBalances,
                          });
                        }
                      }}
                      color="primary"
                    />{' '}
                    True
                  </div>
                  <div>
                    Node Info: False
                    <Switch
                      checked={localNotificationSettings?.nodeInfo}
                      onChange={() => {
                        if (localNotificationSettings) {
                          set_localNotificationSettings({
                            ...localNotificationSettings,
                            nodeInfo: !localNotificationSettings.nodeInfo,
                          });
                        }
                      }}
                      color="primary"
                    />{' '}
                    True
                  </div>
                </NotificationsContainer>
                <Button
                  style={{
                    marginTop: '1rem',
                    float: 'right',
                  }}
                  onClick={handleSaveSettings}
                  disabled={!canSave}
                >
                  Save
                </Button>
              </td>
            </tr>

            <tr>
              <th>Strategies</th>
              <td>
                {strategiesString && (
                  <CodeCopyBox
                    code={strategiesString}
                    breakSpaces
                  />
                )}
              </td>
            </tr>
            <tr>
              <th>Configuration</th>
              <td>
                {configurationString && (
                  <CodeCopyBox
                    code={configurationString}
                    breakSpaces
                  />
                )}
              </td>
            </tr>
          </tbody>
        </TableExtended>
      </Paper>
    </Section>
  );
}

export default SettingsPage;
