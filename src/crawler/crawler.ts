import puppeteer from "puppeteer";
import { log, error } from "@src/utilities/log";

type Notice = {
  no: number;
  title: string;
  author: string;
  files: number;
  date: string;
};

type Reference = {
  no: number;
  title: string;
  author: string;
  files: number;
  date: string;
};

type SubjectData = {
  notices: Notice[];
  references: Reference[];
};

type CrawlData = {
  [subject: string]: SubjectData;
};

class Crawler {
  browser: puppeteer.Browser | null = null;
  page: puppeteer.Page | null = null;

  async init() {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();

    log("Crawler prepared.");
  }

  async close() {
    if (!this.browser || !this.page) {
      this.abort("Call init() first!");
      return;
    }

    await this.browser.close();

    this.browser = null;
    this.page = null;
  }

  async abort(message: string) {
    error(message);
    process.exit();
  }

  async login(id: string, pw: string) {
    if (!this.browser || !this.page) {
      this.abort("Call init() first!");
      return;
    }

    log("Logging in...");

    this.page.goto("https://eclass.dongguk.edu/Main.do?cmd=viewHome");
    await this.page.waitForNavigation();

    await this.page.click(".total_login a");
    await this.page.type('input[name="userDTO.userId"]', id);
    await this.page.type('input[name="userDTO.password"]', pw);
    await this.page.click(".loginBtn");
    await this.page.waitForNavigation();

    log("Logged in.");
  }

  async getSubjects() {
    if (!this.browser || !this.page) {
      this.abort("Call init() first!");
      return;
    }

    log("Getting subjects...");

    await this.page.goto("https://eclass.dongguk.edu/Main.do?cmd=viewHome");

    const container = await this.page.$("#mCSB_1_container");
    if (!container) {
      this.abort("Subject containers not found!");
      return;
    }

    const subjectEls = await container.$$("li");
    const subjects: { [index: string]: string } = {};
    for (const subjectEl of subjectEls) {
      const titleEl = await subjectEl.$(".boardTxt");
      const buttonEl = await subjectEl.$(".boardBtn button");

      const title = await titleEl?.evaluate((e) => e.innerHTML.trim());
      const id = await buttonEl?.evaluate((e) => {
        const onclick = e.getAttribute("onclick");
        const matches = onclick?.match(/viewCourse\('([^']*)'\)/);
        if (!matches) return null;

        return matches[1].split(",")[0];
      });

      if (title && id) subjects[title] = id;
    }

    log("Got subjects.");

    return subjects;
  }

  async getNotices(subjectId: string) {
    if (!this.browser || !this.page) {
      this.abort("Call init() first!");
      throw null;
    }

    log("Getting notices for ", subjectId);

    const homeUrl = `https://eclass.dongguk.edu/Course.do?cmd=viewStudyHome&boardInfoDTO.boardInfoGubun=study_home&courseDTO.courseId=${subjectId}`;

    await this.page.goto(homeUrl);

    const noticeUrl = await this.page.$eval(".menuSub.mp2 a:first-child", (e) =>
      e.getAttribute("href")
    );
    if (!noticeUrl) throw null;

    let page = 1;
    const notices: Notice[] = [];
    while (true) {
      log("- current page: ", page);

      const curNoticeUrl = `https://eclass.dongguk.edu${noticeUrl}&curPage=${page}`;
      await this.page.goto(curNoticeUrl);

      const noticeEls = await this.page.$$("table.boardListBasic tbody>tr");
      if (noticeEls.length == 0) break;
      for (const noticeEl of noticeEls) {
        const no = await noticeEl.$eval("td:nth-child(1)", (e) =>
          e.textContent?.trim()
        );
        const title = await noticeEl.$eval("td:nth-child(2)", (e) =>
          e.textContent?.trim()
        );
        const files = -1;
        const author = await noticeEl.$eval("td:nth-child(4)", (e) =>
          e.textContent?.trim()
        );
        const date = await noticeEl.$eval("td:nth-child(5)", (e) =>
          e.textContent?.trim()
        );

        if (
          no != null &&
          title != null &&
          files != null &&
          author != null &&
          date != null
        ) {
          notices.push({
            no: Number.parseInt(no),
            title,
            author,
            files,
            date,
          });
        }
      }

      page++;
    }

    log("Got notices.");

    return notices;
  }

  async getReferences(subjectId: string) {
    if (!this.browser || !this.page) {
      this.abort("Call init() first!");
      throw null;
    }

    log("Getting references for ", subjectId);

    const homeUrl = `https://eclass.dongguk.edu/Course.do?cmd=viewStudyHome&boardInfoDTO.boardInfoGubun=study_home&courseDTO.courseId=${subjectId}`;

    await this.page.goto(homeUrl);

    let referenceUrl = await this.page.$eval(
      ".menuSub.mp1 li:nth-child(3) a",
      (e) => e.getAttribute("href")
    );
    if (!referenceUrl) throw null;

    await this.page.goto(`https://eclass.dongguk.edu${referenceUrl}`);
    referenceUrl = this.page.url();

    let page = 1;
    const references: Notice[] = [];
    while (true) {
      log("- current page: ", page);

      const curReferenceUrl = `${referenceUrl}&curPage=${page}`;
      await this.page.goto(curReferenceUrl);

      const referencesEls = await this.page.$$("table.boardListBasic tbody>tr");
      const notFound = (
        await referencesEls[0].evaluate((e) => e.textContent)
      )?.includes("없습니다");
      if (notFound) break;

      for (const referenceEl of referencesEls) {
        const no = await referenceEl.$eval("td:nth-child(1)", (e) =>
          e.textContent?.trim()
        );
        const title = await referenceEl.$eval("td:nth-child(2)", (e) =>
          e.textContent?.trim()
        );
        const files = -1;
        const author = await referenceEl.$eval("td:nth-child(4)", (e) =>
          e.textContent?.trim()
        );
        const date = await referenceEl.$eval("td:nth-child(5)", (e) =>
          e.textContent?.trim()
        );

        if (
          no != null &&
          title != null &&
          files != null &&
          author != null &&
          date != null
        ) {
          references.push({
            no: Number.parseInt(no),
            title,
            author,
            files,
            date,
          });
        }
      }

      page++;
    }

    log("Got references.");

    return references;
  }

  async crawl(id: string, pw: string) {
    log("Start eclass crawler...");

    await this.login(id, pw);

    const subjects = await this.getSubjects();
    if (!subjects) {
      this.abort("No subjects!");
      return;
    }

    const data: CrawlData = {};
    for (const subject in subjects) {
      const subjectId = subjects[subject];
      data[subject] = {
        notices: await this.getNotices(subjectId),
        references: await this.getReferences(subjectId),
      };
    }

    log("Finish!");

    return data;
  }
}

export default Crawler;
