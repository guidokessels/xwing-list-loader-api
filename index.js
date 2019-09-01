require("newrelic");

const express = require("express");
const compression = require("compression");
const listLoader = require("xwing-list-loader");
const Sentry = require("@sentry/node");
const cors = require("cors");
const graphqlHTTP = require("express-graphql");
const { buildSchema } = require("graphql");

const { schema, resolvers } = require("./graphql");

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

// Enable compression
app.use(compression());

// Enable cors
app.use(cors());

// GraphQL endpoint
app.use(
  "/api/v1",
  graphqlHTTP({
    schema: buildSchema(schema),
    rootValue: resolvers,
    graphiql: true,
    customFormatErrorFn: error =>
      process.env.NODE_ENV === "production"
        ? { message: error.message }
        : {
            message: error.message,
            locations: error.locations,
            stack: error.stack ? error.stack.split("\n") : [],
            path: error.path
          }
  })
);

// Routes
app
  .get("/", (req, res) => {
    res.status(404).send("Available endpoints: /xws?list=YOUR_URL and /api/v1");
  })
  .get("/xws", (req, res) => {
    const {
      query: { url }
    } = req;

    if (!url) {
      res.status(400).send("Missing required query string parameter `url`");
      return;
    }

    listLoader.load(url).then(
      result => {
        if (result === false) {
          res.status(404).send(failResponse);
        } else {
          res.send({ url, xws: result });
        }
      },
      error => {
        res.status(500).send(error);
        Sentry.captureException(error);
      }
    );
  });

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
