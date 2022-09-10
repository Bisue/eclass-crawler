import puppeteer from 'puppeteer';
import { log, error } from '@src/utilities/log';

/**
 * 사용자 로그인 정보
 */
export interface UserCredential {
  id: string;
  password: string;
}

/**
 * 과목
 */
export interface Course {
  id: string;
  name: string;
}

/**
 * 공지사항
 */
export interface Notice {
  no: string;
  title: string;
  author: string;
  created: Date;
}

/**
 * 과제
 */
export interface Assignment {
  title: string;
  deadline: Date;
  finished: boolean;
}

/**
 * 자료실
 */
export interface Resource {
  no: string;
  title: string;
  author: string;
  created: Date;
}

/**
 * 크롤링 결과
 */
export type CrawledData = {
  course: string;
  notices: Notice[];
  assignments: Assignment[];
  resources: Resource[];
};

/**
 * 이클래스 크롤러
 */
export class EclassCrawler {
  browser: puppeteer.Browser;
  loggedIn: boolean = false;

  constructor(browser: puppeteer.Browser) {
    this.browser = browser;
  }

  /**
   * 주어진 url을 표시하는 새로운 페이지를 생성
   */
  private async makeNewPage(url: string): Promise<puppeteer.Page> {
    const page = await this.browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    return page;
  }

  /**
   * 주어진 credential로 로그인
   */
  private async login({ id, password }: UserCredential): Promise<boolean> {
    let page: puppeteer.Page | null = null;
    try {
      page = await this.makeNewPage('https://eclass.dongguk.edu/Main.do?cmd=viewHome');

      // 로그인 폼 전송
      await page.click('.total_login a');
      await page.type('input[name="userDTO.userId"]', id);
      await page.type('input[name="userDTO.password"]', password);
      await page.click('.loginBtn');

      await page.waitForNavigation();

      return true;
    } catch (e) {
      error('로그인 중 오류가 발생했습니다!');

      return false;
    } finally {
      await page?.close();
    }
  }

  /**
   * 수강중인 강의 목록 크롤링
   */
  private async crawlCourses(): Promise<Course[]> {
    let page: puppeteer.Page | null = null;
    try {
      page = await this.makeNewPage(`https://eclass.dongguk.edu/Main.do?cmd=viewHome`);

      // 수강중인 강의 목록 (첫 element는 헤딩)
      const courseElements = (await page.$$('select[name="courseDTO.courseId"] > option')).slice(1);
      const courses: Course[] = await Promise.all(
        courseElements.map(el =>
          el.evaluate(e => {
            return {
              id: e.getAttribute('value')!.split(',')[0],
              name: e.textContent!.trim(),
            };
          })
        )
      );

      return courses;
    } catch (e) {
      error('과목 크롤링 중 오류가 발생했습니다!');

      throw e;
    } finally {
      await page?.close();
    }
  }

  /**
   * 주어진 과목의 공지사항 크롤링
   */
  private async crawlNotices({ id, name }: Course): Promise<Notice[]> {
    let page: puppeteer.Page | null = null;
    try {
      page = await this.makeNewPage(`https://eclass.dongguk.edu/Course.do?cmd=viewStudyHome&boardInfoDTO.boardInfoGubun=study_home&courseDTO.courseId=${id}`);
      // 공지사항 게시판 페이지 url 크롤링 (이클래스 url 생성 방식이 조금 이상)
      const basePath = (await page.$eval('.menuSub.mp2 a:first-child', e => e.getAttribute('href')))!;

      const notices: Notice[] = [];
      for (let curPage: number = 1; ; curPage++) {
        const curUrl = `https://eclass.dongguk.edu${basePath}&curPage=${curPage}`;
        log(`(notices) ${name}: curPage = ${curPage}`);
        await page.goto(curUrl, { waitUntil: 'domcontentloaded' });

        const noticeElements = await page.$$('table.boardListBasic tbody>tr');
        if (noticeElements.length === 0) break;

        for (const noticeElement of noticeElements) {
          const no = await noticeElement.$eval('td:nth-child(1)', e => e.textContent!.trim());
          const title = await noticeElement.$eval('td:nth-child(2)', e => e.textContent!.trim());
          const author = await noticeElement.$eval('td:nth-child(4)', e => e.textContent!.trim());
          const created = await noticeElement.$eval('td:nth-child(5)', e => e.textContent!.trim());

          notices.push({ no, title, author, created: new Date(created) });
        }
      }

      return notices;
    } catch (e) {
      error(`${name}: 공지사항 크롤링 중 오류가 발생했습니다!`);

      throw e;
    } finally {
      await page?.close();
    }
  }

  /**
   * 주어진 과목의 과제 크롤링
   */
  private async crawlAssignments({ id, name }: Course): Promise<Assignment[]> {
    let page: puppeteer.Page | null = null;
    try {
      page = await this.makeNewPage(`https://eclass.dongguk.edu/Course.do?cmd=viewStudyHome&boardInfoDTO.boardInfoGubun=study_home&courseDTO.courseId=${id}`);
      // 과제 게시판 페이지 url 크롤링 (이클래스 url 생성 방식이 조금 이상)
      const basePath = (await page.$eval('.menuSub.mp4 li:nth-child(2) a', e => e.getAttribute('href')))!;

      const assignments: Assignment[] = [];

      log(`(assignment) ${name}: crawling...`);
      await page.goto(`https://eclass.dongguk.edu${basePath}`, { waitUntil: 'domcontentloaded' });

      const assignmentElements = await page.$$('.listContent.pb20');
      for (const assignmentElement of assignmentElements) {
        const title = (await assignmentElement.$eval('.listContent.pb20 dt h4', el => el.childNodes[2].textContent!)).trim();
        const deadline = (await assignmentElement.$eval('.boardListInfo tbody td:first-child', el => el.textContent!)).split('~')[1].trim();
        const finished = (await assignmentElement.$eval('.boardListInfo tbody td:nth-child(4)', el => el.textContent!)).includes('제출완료');

        assignments.push({ title, finished, deadline: new Date(deadline) });
      }

      return assignments;
    } catch (e) {
      error(`${name}: 과제 크롤링 중 오류가 발생했습니다!`);

      throw e;
    } finally {
      await page?.close();
    }
  }

  /**
   * 주어진 과목의 자료실 크롤링
   */
  private async crawlResources({ id, name }: Course): Promise<Resource[]> {
    let page: puppeteer.Page | null = null;
    try {
      page = await this.makeNewPage(`https://eclass.dongguk.edu/Course.do?cmd=viewStudyHome&boardInfoDTO.boardInfoGubun=study_home&courseDTO.courseId=${id}`);
      // 자료실 게시판 페이지 url 크롤링 (이클래스 url 생성 방식이 조금 이상)
      const tempPath = (await page.$eval('.menuSub.mp1 li:nth-child(3) a', e => e.getAttribute('href')))!;
      await page.goto(`https://eclass.dongguk.edu${tempPath}`);
      const basePath = page.url();

      const resources: Resource[] = [];
      for (let curPage: number = 1; ; curPage++) {
        const curUrl = `${basePath}&curPage=${curPage}`;
        log(`(resources) ${name}: curPage = ${curPage}`);
        await page.goto(curUrl, { waitUntil: 'domcontentloaded' });

        const resourceElements = await page.$$('table.boardListBasic tbody>tr');
        const empty = (await resourceElements[0].evaluate(e => e.textContent))?.includes('없습니다');
        if (empty) break;

        for (const referenceEl of resourceElements) {
          const no = await referenceEl.$eval('td:nth-child(1)', e => e.textContent!.trim());
          const title = await referenceEl.$eval('td:nth-child(2)', e => e.textContent!.trim());
          const author = await referenceEl.$eval('td:nth-child(4)', e => e.textContent!.trim());
          const created = await referenceEl.$eval('td:nth-child(5)', e => e.textContent!.trim());

          resources.push({ no, title, author, created: new Date(created) });
        }
      }

      return resources;
    } catch (e) {
      error(`${name}: 자료실 크롤링 중 오류가 발생했습니다!`);

      throw e;
    } finally {
      await page?.close();
    }
  }

  /**
   * 이클래스 크롤러 실행
   */
  public async run(credentials: UserCredential) {
    this.loggedIn = await this.login(credentials);
    if (!this.loggedIn) throw Error('로그인 실패!');

    const courses = await this.crawlCourses();
    log(
      'my courses: ',
      courses.map(c => c.name)
    );
    const crawledData: CrawledData[] = await Promise.all(
      courses.map(async course => ({
        course: course.name,
        notices: await this.crawlNotices(course),
        assignments: await this.crawlAssignments(course),
        resources: await this.crawlResources(course),
      }))
    );

    return crawledData;
  }

  public async close() {
    await this.browser.close();
  }
}
