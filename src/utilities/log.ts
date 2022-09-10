import dayjs from 'dayjs';
import chalk from 'chalk';

export const log = (...args: any[]) => {
  const timestamp = dayjs().format('MM-DD HH:mm:ss SSS');

  console.log.apply(null, [chalk.gray(`[${timestamp}]`), chalk.blue(`[LOG]`), ...args]);
};

export const error = (...args: any[]) => {
  const timestamp = dayjs().format('MM-DD HH:mm:ss SSS');
  console.log.apply(null, [chalk.blue(`[${timestamp}]`), chalk.red(`[ERROR]`), ...args]);
};
