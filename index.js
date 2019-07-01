const express = require("express");
const path = require("path");
const listLoader = require("xwing-list-loader");
const PORT = process.env.PORT || 5000;

express()
  .use(express.static(path.join(__dirname, "public")))
  .get("/", (req, res) => {
    res.status(404).send("Please use /xws?list=YOUR_URL");
  })
  .get("/xws", (req, res) => {
    const {
      query: { list }
    } = req;

    if (!list) {
      res.status(400).send("Missing required query string parameter `list`");
      return;
    }

    console.log(`Loading ${list}`);

    listLoader.load(list).then(
      result => {
        console.log(typeof result);
        console.log(result);
        if (result === false) {
          res.status(500).send(result);
        } else {
          res.send({ list, xws: result });
        }
      },
      error => {
        res.status(500).send({ error: result });
      }
    );
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
