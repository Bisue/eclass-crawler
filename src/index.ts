import dotenv from "dotenv";
import Crawler from "./crawler";
import { log } from "./log";
import fs from "fs";

dotenv.config();

(async () => {
  const crawler = new Crawler();
  await crawler.init();

  const id = process.env.STD_ID ?? "";
  const pw = process.env.STD_PW ?? "";
  const data = await crawler.crawl(id, pw);

  const json = JSON.stringify(data, undefined, 4);
  const path = "./output.json";
  fs.writeFileSync(path, json);

  log(`Data saved at '${path}'`);

  await crawler.close();
})();
