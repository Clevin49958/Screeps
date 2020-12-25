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
const myLink = require('./link');
const myTerminal = require('./terminal');
const {Logger} = require('./Logger');

const profiler = require('screeps-profiler');

// execute alterOnce for once
Memory.exec = true;

const main = () => {
  // update code check
  if (!Memory.SCRIPT_VERSION || Memory.SCRIPT_VERSION != SCRIPT_VERSION) {
    Memory.SCRIPT_VERSION = SCRIPT_VERSION;
    console.log('New code uploaded');
  }

  // terminal processing
  for (const room in Memory.myRooms) {
    const terminal = Game.rooms[room].terminal;
    if (!(Game.time % 500) && terminal) {
      myTerminal.autoDealExcess(terminal);
    }
  }

  // CPU bucket check
  if (Game.cpu.bucket < 50 || false) {
    // skip ticket
    let timeSinceLastSkip = -1;
    if (global.lastSkip) {
      timeSinceLastSkip = Game.time - global.lastSkip;
    }
    global.lastSkip = Game.time;
    if (timeSinceLastSkip > 1000 || timeSinceLastSkip == -1) {
      Logger.info(`Skipping tick ${Game.time}, current bucket: ${Game.cpu.bucket}, time since last skip: ${timeSinceLastSkip}`);
    } else {
      Logger.warn(`Skipping tick, current bucket: <${Math.floor(Game.cpu.bucket/100) + 1}00, time since last skip: <${Math.floor(timeSinceLastSkip/10) + 1}0`);
    }

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

  init.alter();

  init.alterOnce();

  tower.defendMyRoom();

  lib.runCreeps();

  // link processing
  for (const room in Memory.myRooms) {
    myLink.ship(room);
  }

  // spawn creeps
  for (const name in Game.spawns) {
    // if ({}.hasOwnProperty.call(Game.spawns, name)) {
    if (name == 'Spawn1' || name == 's' || name == 's3') continue;
    lib.generateCreeps(name);
    Logger.trace('-----------------------');
    // }
  }

  // watch values
  watcher();

  stateScanner.stateScanner();

  // console line break
  if (Game.time % helper.logRate == 0) {
    Logger.info(
        '--------------------------------------------------------');
  } else if (Game.time % 2) {
    Logger.info(`------------`);
  }
};

if (false) {
  profiler.enable();
  module.exports.loop = function() {
    profiler.wrap(function() {
      main();
    });
  };
} else {
  module.exports.loop = main();
}
