const express = require("express");
const path = require("path");
const listLoader = require("xwing-list-loader");
const Sentry = require("@sentry/node");

const PORT = process.env.PORT || 5000;
const app = express();

const failResponse = `The list could not be loaded. This usually means one of the following:

- The list does not exist
- The list URL does not match one of the supported integrations (https://github.com/guidokessels/xwing-list-loader/#supported-integrations)
- The integration did not return a valid XWS JSON response
- The request to fetch the XWS failed`;

Sentry.init({
  dsn: "https://8f710925860847e9bb12c6c4d1001c1f@sentry.io/1494172"
});

// The Sentry request handler *must* be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
// The Sentry error handler *must* be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Routes
app
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

    listLoader.load(list).then(
      result => {
        if (result === false) {
          res.status(404).send(failResponse);
        } else {
          res.send({ list, xws: result });
        }
      },
      error => {
        res.status(500).send(error);
        Sentry.captureException(error);
      }
    );
  });

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
