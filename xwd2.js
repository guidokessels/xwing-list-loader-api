const manifest = require("xwing-data2/data/manifest.json");
const loadedData = {};

const getPilots = () => {
  if (!loadedData.pilots) {
    console.log(`Loading pilots and ships from xwing-data2`);

    const allPilots = [];

    manifest.pilots.forEach(({ ships }) => {
      ships.forEach(filename => {
        const { pilots = [], ...ship } = require(`xwing-data2/${filename}`);
        const pilotsWithShip = pilots.map(pilot => {
          pilot.ship = ship;
          return pilot;
        });
        allPilots.push(...pilotsWithShip);
      });
    });

    loadedData.pilots = allPilots;
  }

  console.log(`Found`, loadedData.pilots.length, `pilots`);
  return loadedData.pilots;
};

const getUpgrades = () => {
  if (!loadedData.upgrades) {
    console.log(`Loading upgrades from xwing-data2`);

    const allUpgrades = [];

    manifest.upgrades.forEach(filename => {
      const upgrades = require(`xwing-data2/${filename}`);
      allUpgrades.push(...upgrades);
    });

    loadedData.upgrades = allUpgrades;
  }

  console.log(`Found`, loadedData.upgrades.length, `upgrades`);
  return loadedData.upgrades;
};

module.exports = {
  getPilots,
  getUpgrades
};
