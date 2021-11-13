const express = require("express");
const app = express();
const port = 3001;
const axios = require("axios").default;
const reits = require("./reits");
const fiis = require("./fiis");
const EventEmitter = require("events");

const emitter = new EventEmitter();

emitter.setMaxListeners(0);

const urlDB =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "http://db:3000";

app.get("/reits/:ticker", async (req, res) => {
  const ticker = String(req.params.ticker).toLowerCase();

  await reits.store_dividend(ticker);

  try {
    const { data } = await reits.exist_ticker(ticker);
    res.send(data);
  } catch (error) {
    res.send("erro");
  }
});

app.get("/fiis/:ticker", async (req, res) => {
  const ticker = String(req.params.ticker).toLowerCase();

  await fiis.store_dividend(ticker);

  try {
    const { data } = await fiis.exist_ticker(ticker);
    res.send(data);
  } catch (error) {
    res.send("erro");
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
