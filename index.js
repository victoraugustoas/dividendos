const puppeteer = require("puppeteer");
const axios = require("axios").default;

const urlDB =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "http://db:3000";

const resolve_captcha = async (page) => {
  const result = await page.evaluate(() =>
    Array.from(document.querySelectorAll("#px-captcha")).map((element) => ({
      offsetLeft: element.offsetLeft,
      offsetTop: element.offsetTop,
    }))
  );

  let continueVerify = await page.evaluate(() =>
    Boolean(document.querySelector("#px-captcha > p"))
  );
  let count = 0;

  do {
    await page.mouse.move(result[0].offsetLeft + 10, result[0].offsetTop + 10);
    await page.waitForTimeout(20 * 1000);
    await page.mouse.down();
    await page.screenshot({ path: "screen1.png" });
    await page.waitForTimeout(20 * 1000);
    await page.screenshot({ path: "screen2.png" });
    await page.mouse.up();
    await page.waitForTimeout(20 * 1000);
    await page.screenshot({ path: "screen3.png" });
    continueVerify = await page.evaluate(() =>
      Boolean(document.querySelector("#px-captcha > p"))
    );
    count++;
  } while (continueVerify && count < 3);
};

const fetch_dividend = async (url) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--disable-features=site-per-process",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list",
      '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: { width: 1366, height: 768 },
  });
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(true);

  // navega para a url
  await page.goto(url, { waitUntil: "networkidle2" });

  try {
    const result = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(
          "#root > div:nth-child(1) > main > div > div > div:nth-child(4) > div > div > section:nth-child(3) > div > div:nth-child(2) > div > div:nth-child(1) > div:nth-child(2)"
        )
      ).map((element) => element.innerHTML)
    );

    if (result.length === 0) {
      await resolve_captcha(page);
    }

    await page.waitForTimeout(5 * 1000);
    await page.screenshot({ path: "screen.png" });

    await browser.close();

    console.log({ result });

    return result && result.length ? Number(result[0].replace("$", "")) : 0;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const exist_ticker = async (ticker) => {
  try {
    const { data } = await axios.get(`${urlDB}/ticker/${ticker}`);
    return Boolean(data);
  } catch (error) {
    return false;
  }
};

const store_dividend = async (ticker) => {
  const url = `https://seekingalpha.com/symbol/${ticker}/dividends/scorecard`;

  try {
    const exists = await exist_ticker(ticker);
    if (exists) {
      const dividend = await fetch_dividend(url);
      await axios.put(`${urlDB}/ticker/${ticker}`, {
        dividend: dividend > 0 ? dividend : null,
        updateAt: new Date(),
      });
    } else {
      const dividend = await fetch_dividend(url);
      await axios.post(`${urlDB}/ticker`, {
        dividend: dividend > 0 ? dividend : null,
        ticker,
        updateAt: new Date(),
        id: ticker,
      });
    }
  } catch (error) {
    throw error;
  }
};

module.exports = { fetch_dividend, store_dividend };
