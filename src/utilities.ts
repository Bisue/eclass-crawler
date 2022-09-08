import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import { log, error } from "@src/log";

/**
 * `./output/${timestamp}.json`에 JSON으로 변환 후 저장
 */
export const save = (data: any) => {
  const dir = "./output";
  const filename = dayjs().format("YYYY-MM-DD-HH-mm-ss") + ".json";
  const filepath = path.join(dir, filename);

  const json = JSON.stringify(data, undefined, 2);
  fs.writeFileSync(filepath, json);

  log(`Data saved at '${filepath}'`);
};
