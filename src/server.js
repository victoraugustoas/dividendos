const express = require("express");
const app = express();
const port = 3001;
const getDividend = require("./get_dividend");

app.use(express.json());

const urlDB = app.post("/dividend", async (req, res) => {
  const ticker = String(req.body.ticker).toLowerCase();
  const path = String(req.body.path).toLowerCase();

  try {
    const data = await getDividend.store_dividend({ ticker, path });
    res.send(data);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
