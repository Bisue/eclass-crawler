import dayjs from "dayjs";

export const log = (...args: any[]) => {
  const timestamp = dayjs().format("MM-DD HH:mm:ss SSS");
  console.log.apply(null, [`[${timestamp}] [LOG]`, ...args]);
};

export const error = (...args: any[]) => {
  const timestamp = dayjs().format("MM-DD HH:mm:ss SSS");
  console.log.apply(null, [`[${timestamp}] [ERROR]`, ...args]);
};
