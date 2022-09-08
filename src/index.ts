import config from "./config";
import Crawler from "./crawler";
import { save } from "./utilities";

(async () => {
  const crawler = new Crawler();
  await crawler.init();

  const data = await crawler.crawl(config.id, config.pw);

  save(data);

  await crawler.close();
})();
