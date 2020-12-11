// import modules
require('prototype.spawn')();
require('Traveler');
require('version');
const watcher = require('watch-client');
const stateScanner = require('stateScanner');
const helper = require('./helper');
const lib = require('./lib');
const tower = require('./tower');
const init = require('./init');
const link = require('./link');
const Logger = require('./Logger');

const profiler = require('screeps-profiler');

// This line monkey patches the global prototypes.
// profiler.enable();
module.exports.loop = function() {
  profiler.wrap(function() {
    // update code check
    if (!Memory.SCRIPT_VERSION || Memory.SCRIPT_VERSION != SCRIPT_VERSION) {
      Memory.SCRIPT_VERSION = SCRIPT_VERSION;
      console.log('New code uploaded');
    }

    if (Game.cpu.bucket < 2000 || false) {
      // skip ticket
      Logger.warn(`Skipping tick ${Game.time}, current bucket: ${Game.cpu.bucket}`);
      return;
    }

    // Remove dead screeps in memory
    for (const name in Memory.creeps) {
      // and checking if the creep is still alive
      if (!Game.creeps[name]) {
        // if not, delete the memory entry
        delete Memory.creeps[name];
      }
    }

    init.minCreeps();

    init.alter();

    init.alterOnce();

    tower.defendMyRoom();

    lib.runCreeps();

    for (const room in Memory.myRooms) {
      if ({}.hasOwnProperty.call(Memory.myRooms, room)) {
        link.ship(room);
      }
    }
    for (const name in Game.spawns) {
      if ({}.hasOwnProperty.call(Game.spawns, name)) {
        lib.generateCreeps(name);
        Logger.trace('-----------------------');
      }
    }

    // watch values
    watcher();

    stateScanner.stateScanner();

    if (Game.time % helper.logRate == 0) {
      Logger.info(
          '--------------------------------------------------------');
    } else if (Game.time % 2) {
      Logger.info(`------------`);
    }
  });
};
