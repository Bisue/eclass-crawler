import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { log, error } from '@src/utilities/log';
import type { CrawledData } from '@src/crawler/crawler';
import chalk from 'chalk';

/**
 * `./output/${timestamp}.json`에 JSON으로 변환 후 저장
 */
export const save = (data: CrawledData[]) => {
  const dir = './output';

  // 가장 마지막 데이터
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  if (files.length > 0) {
    const latestFilename = files.sort().at(-1)!;
    const latestFilepath = path.join(dir, latestFilename);

    // [TODO: 딥하게 비교 제대로 해서 과목명/카테고리/제목 알림]
    const match = fs.readFileSync(latestFilepath).toString() == JSON.stringify(data, undefined, 2);
    if (match) log(chalk.green(`===== Data equals to latest previous crawled data. =====`));
    else log(chalk.red(`===== Some data added/removed/modified from latest previous crawled data! Please check. =====`));
  }

  // 신규 데이터 저장
  const filename = dayjs().format('YYYY-MM-DD-HH-mm-ss') + '.json';
  const filepath = path.join(dir, filename);

  const json = JSON.stringify(data, undefined, 2);
  fs.writeFileSync(filepath, json);

  log(`New crawled data saved at '${filepath}'.`);
};
