const fs = require("fs");
const listLoader = require("xwing-list-loader");
const { getPilots, getUpgrades } = require("./xwd2");

const schema = fs.readFileSync("./schema.graphql", "utf-8");

const arrToDictOnKey = key => (acc, item) => {
  acc[item[key]] = item;
  return acc;
};

const allUpgrades = getUpgrades().reduce(arrToDictOnKey("xws"), {});
const allPilots = getPilots().reduce(arrToDictOnKey("xws"), {});

const getList = listUrl =>
  listLoader
    .load(listUrl)
    .then(xws => {
      if (!xws.pilots || !xws.pilots.length) {
        throw new Error("Could not load list.");
      }
      return xws.pilots.reduce(
        (acc, { id: pilotXWSId, upgrades = {} }) => {
          acc.pilotXWSIds.add(pilotXWSId);

          Object.values(upgrades)
            .flat(2)
            .forEach(upgradeXWSId => acc.upgradeXWSIds.add(upgradeXWSId));
          return acc;
        },
        {
          xws,
          pilotXWSIds: new Set(),
          upgradeXWSIds: new Set()
        }
      );
    })
    .then(({ xws, pilotXWSIds, upgradeXWSIds }) => {
      return {
        xws: JSON.stringify(xws),
        pilots: [...pilotXWSIds].map(xwsId => allPilots[xwsId]).filter(Boolean),
        upgrades: [...upgradeXWSIds]
          .map(xwsId => allUpgrades[xwsId])
          .filter(Boolean)
      };
    });

const resolvers = {
  pilot: ({ xws }) => allPilots[xws],
  pilots: ({ xws }) => (xws ? xws.map(id => allPilots[id]) : allPilots),
  upgrade: ({ xws }) => allUpgrades[xws],
  upgrades: ({ xws }) => (xws ? xws.map(id => allUpgrades[id]) : allUpgrades),
  list: ({ url }) => getList(url)
};

module.exports = { resolvers, schema };
