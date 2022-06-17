import dayjs from "dayjs";

export default (...args: any[]) => {
  const timestamp = dayjs().format("MM-DD HH:mm:ss SSS");
  console.log.apply(null, [`[${timestamp}] [LOG]`, ...args]);
};
