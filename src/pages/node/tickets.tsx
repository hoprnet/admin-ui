import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { actionsAsync } from '../../store/slices/node/actionsAsync';
import { exportToFile } from '../../utils/helpers';
import { formatEther } from 'viem';

// HOPR Components
import { TableExtended } from '../../future-hopr-lib-components/Table/columed-data';
import { SubpageTitle } from '../../components/SubpageTitle';
import Section from '../../future-hopr-lib-components/Section';
import IconButton from '../../future-hopr-lib-components/Button/IconButton';
import Tooltip from '../../future-hopr-lib-components/Tooltip/tooltip-fixed-width';

// Mui
import { Paper } from '@mui/material';

// Icons
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

function TicketsPage() {
  const dispatch = useAppDispatch();
  const statistics = useAppSelector((store) => store.node.statistics.data);
  const statisticsFetching = useAppSelector((store) => store.node.statistics.isFetching);
  const redeemAllTicketsFetching = useAppSelector((store) => store.node.redeemAllTickets.isFetching);
  const redeemAllTicketsErrors = useAppSelector((store) => store.node.redeemAllTickets.error);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const info = useAppSelector((store) => store.node.info.data);
  const ticketPrice = useAppSelector((store) => store.node.ticketPrice.data);
  const minimumNetworkProbability = useAppSelector((store) => store.node.probability.data);


  useEffect(() => {
    handleRefresh();
  }, [loginData, dispatch]);

  const handleRefresh = () => {
    if (loginData.apiEndpoint) {
      dispatch(
        actionsAsync.getTicketStatisticsThunk({
          apiEndpoint: loginData.apiEndpoint,
          apiToken: loginData.apiToken ? loginData.apiToken : '',
        }),
      );
    }
  };

  const handleRedeemAllTickets = () => {
    dispatch(
      actionsAsync.redeemAllTicketsThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
      }),
    )
      .unwrap()
      .then(() => {
        handleRefresh();
      });
  };

  const handleResetTicketsStatistics = () => {
    dispatch(
      actionsAsync.resetTicketStatisticsThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
      }),
    )
      .unwrap()
      .then(() => {
        handleRefresh();
      });
  };

  return (
    <Section
      className="Section--tickets"
      id="Section--tickets"
      fullHeightMin
      yellow
    >
      <SubpageTitle
        title="TICKETS"
        refreshFunction={handleRefresh}
        reloading={statisticsFetching}
        actions={
          <>
            <IconButton
              iconComponent={<ExitToAppIcon />}
              tooltipText={
                <span>
                  REDEEM
                  <br />
                  all tickets
                </span>
              }
              reloading={redeemAllTicketsFetching}
              onClick={handleRedeemAllTickets}
            />
            <IconButton
              iconComponent={<RotateLeftIcon />}
              tooltipText={
                <span>
                  RESET
                  <br />
                  ticket statistics
                </span>
              }
              reloading={redeemAllTicketsFetching}
              onClick={handleResetTicketsStatistics}
            />
          </>
        }
      />
      <Paper
        style={{
          padding: '24px',
          width: 'calc( 100% - 48px )',
        }}
      >
                <TableExtended
          title="Ticket properties"
          style={{ marginBottom: '42px' }}
        >
          <tbody>
            <tr>
              <th>
                <Tooltip
                  title="The current price of a single ticket"
                  notWide
                >
                  <span>Current ticket price</span>
                </Tooltip>
              </th>
              <td>{ticketPrice ? formatEther(BigInt(ticketPrice as string)) : '-'} wxHOPR</td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title={`Minimum allowed winning probability of the ticket as defined in the ${info?.network} network`}
                  notWide
                >
                  <span>Minimum ticket winning probability</span>
                </Tooltip>
              </th>
              <td>
                {minimumNetworkProbability ? minimumNetworkProbability.toFixed(9): '-'}
              </td>
            </tr>
          </tbody>
        </TableExtended>

        <TableExtended
          title="Ticket statistics"
          style={{ marginBottom: '32px' }}
        >
          <tbody>
            <tr>
              <th>
                <Tooltip
                  title="The value of all your unredeemed tickets in HOPR tokens. Value is counted from last DB reset."
                  notWide
                >
                  <span>Unredeemed value</span>
                </Tooltip>
              </th>
              <td>
                {statistics?.unredeemedValue ? formatEther(BigInt(statistics?.unredeemedValue as string)) : '-'} wxHOPR
              </td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The number of tickets lost due to channels closing without ticket redemption. Value is counted from last DB reset."
                  notWide
                >
                  <span>Neglected value</span>
                </Tooltip>
              </th>
              <td>
                {statistics?.neglectedValue ? formatEther(BigInt(statistics?.neglectedValue as string)) : '-'} wxHOPR
              </td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The value of your rejected tickets in HOPR tokens. Value is counted from last DB reset."
                  notWide
                >
                  <span>Rejected value</span>
                </Tooltip>
              </th>
              <td>
                {statistics?.rejectedValue ? formatEther(BigInt(statistics?.rejectedValue as string)) : '-'} wxHOPR
              </td>
            </tr>
            <tr>
              <th>
                <Tooltip
                  title="The value of all your redeemed tickets. Value is counted from last DB reset."
                  notWide
                >
                  <span>Redeemed value</span>
                </Tooltip>
              </th>
              <td>
                {statistics?.redeemedValue ? formatEther(BigInt(statistics?.redeemedValue as string)) : '-'} wxHOPR
              </td>
            </tr>
          </tbody>
        </TableExtended>
      </Paper>
    </Section>
  );
}

export default TicketsPage;
