import config from "./config";
import Crawler from "./crawler";
import { log } from "./log";
import fs from "fs";

(async () => {
  const crawler = new Crawler();
  await crawler.init();

  const data = await crawler.crawl(config.id, config.pw);

  const json = JSON.stringify(data, undefined, 4);
  const path = "./output.json";
  fs.writeFileSync(path, json);

  log(`Data saved at '${path}'`);

  await crawler.close();
})();
