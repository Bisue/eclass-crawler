import dayjs from "dayjs";

const log = (...args: any[]) => {
  const timestamp = dayjs().format("MM-DD HH:mm:ss SSS");
  console.log.apply(null, [`[${timestamp}] [LOG]`, ...args]);
};

const error = (...args: any[]) => {
  const timestamp = dayjs().format("MM-DD HH:mm:ss SSS");
  console.log.apply(null, [`[${timestamp}] [ERROR]`, ...args]);
};

export { log, error };
