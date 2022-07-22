const axios = require("axios").default;
const { isSameDay } = require("date-fns");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { MongoClient } = require("mongodb");

const urlDB =
  process.env.NODE_ENV !== "production"
    ? "mongodb://root:example@localhost:27017"
    : "mongodb://root:example@mongo:27017";

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

const exist_ticker = async ({ ticker, collection }) => {
  try {
    const data = await collection.findOne({ ticker });
    return { exists: Boolean(data), data };
  } catch (error) {
    return { exists: false, data: null };
  }
};

const set_ticker = async ({ ticker, dividend, collection }) => {
  if (dividend) {
    await collection.insertOne({
      updateAt: new Date(),
      dividend,
      ticker,
    });
  }
};

const updateTicker = async ({ ticker, dividend, collection }) => {
  if (dividend) {
    const updateData = { dividend: dividend, updateAt: new Date() };
    await collection.updateOne({ ticker }, { $set: updateData });
  }
};

const connectDB = async () => {
  try {
    const client = new MongoClient(urlDB);
    return client.connect();
  } catch (error) {
    console.log(
      "🚀 ~ file: get_dividend.js ~ line 69 ~ connectDB ~ error",
      error
    );
  }
};

const store_dividend = async ({ ticker, path }) => {
  const url = `https://statusinvest.com.br/${path}/${ticker}`;

  const client = await connectDB();

  try {
    const collection = await client
      .db("dividends")
      .collection(formatPath(path));

    const { exists, data } = await exist_ticker({ ticker, collection });
    if (exists) {
      console.log({ ticker, dividend: data.dividend });
    } else {
      console.log({ ticker, dividend: data });
    }

    if (exists) {
      // ainda nao atualizou no dia
      if (!isSameDay(new Date(data.updateAt), new Date())) {
        const dividend = await fetch_dividend(url);
        await updateTicker({ ticker, dividend, collection });
        const { data } = await exist_ticker({ ticker, collection });
        return data;
      }
    } else {
      const dividend = await fetch_dividend(url);
      await set_ticker({ ticker, dividend, collection });
      const { data } = await exist_ticker({ ticker, collection });
      return data;
    }
    return data;
  } catch (error) {
    console.log(
      "🚀 ~ file: fiis.js ~ line 77 ~ conststore_dividend= ~ error",
      error
    );
  } finally {
    await client.close();
  }
};

module.exports = { fetch_dividend, store_dividend, exist_ticker };
