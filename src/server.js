const express = require("express");
const app = express();
const port = 3001;
const axios = require("axios").default;
const getDividend = require("./get_dividend");
const EventEmitter = require("events");

const emitter = new EventEmitter();

emitter.setMaxListeners(0);
app.use(express.json());

const urlDB =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : "http://db:3000";

app.post("/dividend", async (req, res) => {
  const ticker = String(req.body.ticker).toLowerCase();
  const path = String(req.body.path).toLowerCase();

  await getDividend.store_dividend({ ticker, path });

  try {
    const { data } = await getDividend.exist_ticker({ ticker, path });
    res.send(data);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
