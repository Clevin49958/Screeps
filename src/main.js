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
const { Logger } = require('./Logger');
const memoryTree = require('./memoryTree');
const globalTree = require('./globalTree');
const profiler = require('screeps-profiler');

// execute alterOnce for once
Memory.exec = true;

// update code check
if (!Memory.SCRIPT_VERSION || Memory.SCRIPT_VERSION != SCRIPT_VERSION) {
  Memory.SCRIPT_VERSION = SCRIPT_VERSION;
  console.log('New code uploaded');
}

const starter = () => {
  // CPU bucket check
  if (Game.cpu.bucket < 50 && true) {
    // skip ticket
    let timeSinceLastSkip = -1;
    if (global.lastSkip) {
      timeSinceLastSkip = Game.time - global.lastSkip;
    }
    global.lastSkip = Game.time;
    if (timeSinceLastSkip > 1000 || timeSinceLastSkip == -1) {
      Logger.info(`Skipping tick after upload ${Game.time}, current bucket: ${Game.cpu.bucket}, time since last skip: ${timeSinceLastSkip}`);
    } else {
      Logger.warn(`Skipping tick after upload, current bucket: <${Math.floor(Game.cpu.bucket/100) + 1}00, time since last skip: <${Math.floor(timeSinceLastSkip/10) + 1}0`);
    }

    return;
  } else {
    console.log(`Shard detected: ${Game.shard.name}`);
    if (Game.shard.name == 'shard2') {
      module.exports.loop = emptyShard;
    } else {
      memoryTree.init();
      globalTree.init();
      module.exports.loop = main;
    }
  }
};

const emptyShard = () => {
  if (Game.cpu.bucket == 10000) {
    Game.cpu.generatePixel();
    console.log(`${Game.shard.name} generated a pixel.`)
  } else {
    if (!(Game.time % 20)) {
      console.log(`bucket: ${Game.cpu.bucket}`)
    }
  }
}

const main = () => {
  // generate a creep to occupy an unused shard
  if (!Memory.states.lastOccupier || Game.time - Memory.states.lastOccupier > 1300) {
    if (Game.spawns.Spawn1.spawnCreep([MOVE], 'occupier') == 0) {
      Memory.states.lastOccupier = Game.time;
    }
  }
  if (Game.creeps.occupier) {
    // move to portal
    Game.creeps.occupier.myMoveTo(new RoomPosition(20, 40, 'W30N10'));
  }


  // terminal processing
  for (const room in Memory.myRooms) {
    const terminal = Game.rooms[room].terminal;
    // TODO del
    if (!(Game.time % 10) && terminal) {
      if (room == 'W32N11' && terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 30000) {
        terminal.send(RESOURCE_ENERGY, 27000, 'W34N9','exit');
      }
    }
    if (!(Game.time % 100) && terminal) {
      myTerminal.autoDealExcess(terminal);
    }
  }

  // CPU bucket check
  if (Game.cpu.bucket < 15 || false) {
    // skip ticket
    let timeSinceLastSkip = -1;
    if (global.lastSkip) {
      timeSinceLastSkip = Game.time - global.lastSkip;
    }
    global.lastSkip = Game.time;
    if (
      timeSinceLastSkip > 1000 ||
      timeSinceLastSkip == -1 ||
      (
        Memory.states.lastPixelTime &&
        Game.time - Memory.states.lastPixelTime <= 1
      )) {
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

  memoryTree.autoUpdateRoom();

  try {
    globalTree.generateTasks()
  } catch (e) {
    Logger.warn(`Error running task generation`, e.name, e.message, e.fileName, e.lineNumber, e.stack);
  }

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
      starter;
    });
  };
} else {
  module.exports.loop = starter;
}
