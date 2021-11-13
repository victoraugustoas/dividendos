const puppeteer = require("puppeteer");
const axios = require("axios").default;
const { isThisMonth } = require("date-fns");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const urlDB =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "http://db:3000";

const fetch_dividend = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        Cookie: "_adasys=86fc8772-3be6-4929-b9bc-301e9fde4587",
      },
    });

    const { window } = new JSDOM(response.data);
    const { document } = window;

    const lastDividend = document.querySelector(
      "#earning-section > div.list > div > div:nth-child(2) > table > tbody > tr:nth-child(1) > td:nth-child(4)"
    );

    return Number(lastDividend.innerHTML.replace(",", "."));
  } catch (error) {
    throw error;
  }
};

const exist_ticker = async (ticker) => {
  try {
    const { data } = await axios.get(`${urlDB}/fiis/${ticker}`);
    return { exists: Boolean(data), data };
  } catch (error) {
    return { exists: false, data: null };
  }
};

const set_ticker = async (ticker, dividend) => {
  if (dividend) {
    await axios.post(`${urlDB}/fiis`, {
      dividend,
      ticker,
      updateAt: new Date(),
      id: ticker,
    });
  }
};

const updateTicker = async (ticker, dividend) => {
  if (dividend) {
    await axios.put(`${urlDB}/fiis/${ticker}`, {
      dividend: dividend,
      updateAt: new Date(),
    });
  }
};

const store_dividend = async (ticker) => {
  const url = `https://statusinvest.com.br/fundos-imobiliarios/${ticker}`;

  try {
    const { exists, data } = await exist_ticker(ticker);

    if (exists) {
      // ainda nao atualizou na semana
      if (!isThisWeek(new Date(data.updateAt))) {
        const dividend = await fetch_dividend(url);
        updateTicker(ticker, dividend);
      }
    } else {
      const dividend = await fetch_dividend(url);
      set_ticker(ticker, dividend);
    }
  } catch (error) {
    throw error;
  }
};

module.exports = { fetch_dividend, store_dividend, exist_ticker };
