import puppeteer from 'puppeteer';
import config from '@src/config';
import { EclassCrawler } from '@src/crawler/crawler';
import { save } from '@src/utilities/save';

(async () => {
  // puppeteer 윈도우 생성
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1920, height: 1080 } });
  // crawler 인스턴스 생성
  const crawler = new EclassCrawler(browser);

  // 크롤링
  const data = await crawler.run({ id: config.id, password: config.pw });
  await crawler.close();

  // 데이터 저장
  save(data);
})();
