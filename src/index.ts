import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { log } from "./log";

dotenv.config();

(async () => {
  log("Start puppeteer...");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://eclass.dongguk.edu/Main.do?cmd=viewHome");

  log("Start logging in...");

  // login
  await page.click(".total_login a");
  await page.type('input[name="userDTO.userId"]', process.env.STD_ID ?? "");
  await page.type('input[name="userDTO.password"]', process.env.STD_PW ?? "");
  await page.click(".loginBtn");

  await page.waitForNavigation();

  log("Logged in!");

  log("Getting subjects...");

  // get subjects
  const container = await page.$("#mCSB_1_container");
  if (!container) {
    console.log("ERROR! - No container");
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

  log("Success!");

  console.log(subjects);

  // get notices
  // TODO

  await browser.close();
})();
