import dayjs from 'dayjs';
import TimeAgo from 'react-timeago';
import { default as utc } from 'dayjs/plugin/utc';
import { default as timezone } from 'dayjs/plugin/timezone';

export const formatDateToUserTimezone = (date: string) => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  // guess user timezone;
  const userTimezone = dayjs.tz.guess();
  const formattedDate = dayjs(date).tz(userTimezone).format('YYYY-MM-DD HH:MM');
  return formattedDate;
};

export const formatTimeToUserTimezone = (date: string) => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  // guess user timezone;
  const userTimezone = dayjs.tz.guess();
  const formattedDate = dayjs(date).tz(userTimezone).format('HH:mm');
  return formattedDate;
};

export const calculateTimeInGMT = (date: string) => {
  dayjs.extend(utc);
  const timeInGMT = `${dayjs(date).utc().format('YYYY-MM-DD HH:mm')} GMT ${dayjs(date).utc().format('Z')}`;
  return timeInGMT;
};

export const formatDate = (epoch: number, twoRows = true, now?: number) => {
  if (!epoch)
    return (
      <>
        -<br />
        &nbsp;
      </>
    );
  const differenceMs = Date.now() - new Date(epoch).getTime();
  if (differenceMs < 0)
    return (
      <TimeAgo
        date={new Date(epoch).getTime() - 2 * 60 * 60 * 1000}
        now={now ? () => now : undefined}
      />
    );
  if (differenceMs < 24 * 60 * 60 * 1000) {
    return (
      <TimeAgo
        date={epoch}
        now={now ? () => now : undefined}
      />
    );
  } else {
    const d = new Date(epoch);
    const year = d.getFullYear();
    const month = d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
    const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
    const hours = d.getUTCHours() < 10 ? `0${d.getUTCHours()}` : d.getUTCHours();
    const minutes = d.getUTCMinutes() < 10 ? `0${d.getUTCMinutes()}` : d.getUTCMinutes();
    const formatted = (
      <>
        {`${year}-${month}-${day}`}
        {twoRows ? <br /> : ' '}
        {`${hours}:${minutes}`}
      </>
    );
    return <>{formatted}</>;
  }
};
