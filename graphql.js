const listLoader = require("xwing-list-loader");
const { getPilots, getUpgrades } = require("../xwing-data2/tests/helpers/data");

const arrToDictOnKey = key => (acc, item) => {
  acc[item[key]] = item;
  return acc;
};

const allUpgrades = getUpgrades().reduce(arrToDictOnKey("xws"), {});
const allPilots = getPilots()
  .map(pilot => {
    pilot.upgrades = pilot.slots || [];

    const ship = pilot.ship;

    pilot.ship = {
      ...ship,
      ability: pilot.shipAbility
        ? `${pilot.shipAbility.name}: ${pilot.shipAbility.text}`
        : null
    };
    pilot.faction = ship.faction;
    return pilot;
  })
  .reduce(arrToDictOnKey("xws"), {});

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
  Pilot: ({ xws }) => allPilots[xws],
  Pilots: ({ xws }) => (xws ? xws.map(id => allPilots[id]) : allPilots),
  Upgrade: ({ xws }) => allUpgrades[xws],
  Upgrades: ({ xws }) => (xws ? xws.map(id => allUpgrades[id]) : allUpgrades),
  List: ({ url }) => getList(url)
};

const schema = `
  type Upgrade {
    xws: String!
    name: String!
    limited: Int!
    hyperspace: Boolean!
    sides: [UpgradeSide!]!
  }
  type UpgradeSide {
    title: String!
    type: String!
    ability: String!
    slots: [String!]!
    image: String
    artwork: String
  }
  type Pilot {
    xws: String!
    faction: String!
    name: String!
    caption: String
    ability: String
    image: String
    artwork: String
    text: String
    limited: Int!
    cost: Int
    hyperspace: Boolean!
    initiative: Int!
    upgrades: [String!]!
    ship: Ship
  }
  type Ship {
    name: String!
    ability: String
    icon: String
    xws: String!
    size: BaseSize!
  }
  enum BaseSize {
    Small
    Medium
    Large
  }
  type List {
    xws: String!
    pilots: [Pilot!]!
    upgrades: [Upgrade!]!
  }
  type Query {
    Upgrade(xws: String!): Upgrade
    Upgrades(xws: [String!]): [Upgrade]!
    Pilot(xws: String!): Pilot
    Pilots(xws: [String!]): [Pilot]!
    List(url: String!): List!
  }
`;

module.exports = { resolvers, schema };
