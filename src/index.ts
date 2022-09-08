import config from "@src/config";
import Crawler from "@src/crawler";
import { save } from "@src/utilities";

(async () => {
  const crawler = new Crawler();
  await crawler.init();

  const data = await crawler.crawl(config.id, config.pw);

  save(data);

  await crawler.close();
})();
