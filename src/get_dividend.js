const axios = require("axios").default;
const { isSameDay } = require("date-fns");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const urlDB =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "http://db:3000";

const fetch_dividend = async (url) => {
  try {
    const response = await axios.get(url, {
      withCredentials: true,
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

const formatPath = (path) => String(path).replace("/", "_");

const exist_ticker = async ({ ticker, path }) => {
  try {
    const { data } = await axios.get(`${urlDB}/${formatPath(path)}/${ticker}`);
    return { exists: Boolean(data), data };
  } catch (error) {
    return { exists: false, data: null };
  }
};

const set_ticker = async ({ ticker, dividend, path }) => {
  if (dividend) {
    axios.post(`${urlDB}/${formatPath(path)}`, {
      dividend,
      ticker,
      updateAt: new Date(),
      id: ticker,
    });
  }
};

const updateTicker = async ({ ticker, dividend, path }) => {
  if (dividend) {
    await axios.put(`${urlDB}/${formatPath(path)}/${ticker}`, {
      dividend: dividend,
      updateAt: new Date(),
      ticker,
    });
  }
};

const store_dividend = async ({ ticker, path }) => {
  const url = `https://statusinvest.com.br/${path}/${ticker}`;

  try {
    const { exists, data } = await exist_ticker({ ticker, path });

    if (exists) {
      // ainda nao atualizou no dia
      if (!isSameDay(new Date(data.updateAt), new Date())) {
        const dividend = await fetch_dividend(url);
        await updateTicker({ ticker, dividend, path });
      }
    } else {
      const dividend = await fetch_dividend(url);
      await set_ticker({ ticker, dividend, path });
    }
  } catch (error) {
    console.log(
      "🚀 ~ file: fiis.js ~ line 77 ~ conststore_dividend= ~ error",
      error
    );
  }
};

module.exports = { fetch_dividend, store_dividend, exist_ticker };
