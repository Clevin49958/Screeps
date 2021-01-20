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
const { Logger, JSONsafe } = require('./Logger');
const memoryTree = require('./memoryTree');
const globalTree = require('./globalTree');
const profiler = require('screeps-profiler');
const { Task, TransferTask } = require('./task');
const { alterOnce } = require('./init');
const { BACKUP_MEMORY } = require('./config');

// execute alterOnce for once
Memory.exec = true;
Memory.config.pause = false;

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
      memoryTree.preInit();
      memoryTree.init();
      globalTree.init();
      alterOnce();
      module.exports.loop = main;
      main();
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
  init.preparePerTick();


  // terminal processing
  for (const room in Memory.myRooms) {
    const terminal = Game.rooms[room]?.terminal;
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
      /** @type {TransferTask<any>} */
      const task = global.creeps[name]?.task;
      try {
        if (task) {
          Logger.info(`${name} died with task ${Logger.toMsg(task)}`);
          task.onComplete(ERR_NO_BODYPART);
        }
        // delete the memory entry
        if (global.creeps[name]) {
          Logger.info(`Memory residual of ${name} after clean up: ${Logger.toMsg(global.creeps[name])}
          ${Logger.toMsg(task?.target?.resourceTasks?.[task.srcType])}`)
          delete global.creeps[name];
        } else {
          Logger.warn(`${name} died without global memory`)
        }
        delete Memory.creeps[name];
      } catch (/** @type {Error} */e) {
        Logger.warn(e.message, e.stack)
      }
    }
  }
  
// TODO temp

  // init.alterOnce();

  memoryTree.autoUpdateRoom();

  lib.updateCreepWorkingState();

  try {
    globalTree.generateTasks()
    globalTree.marryTasks();
    init.alter();
    init.alterOnce();
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

  if (BACKUP_MEMORY) {
    const startingTime = Game.cpu.getUsed();
    Memory.global = {
      rooms: JSONsafe(global.rooms),
      creeps: JSONsafe(global.creeps),
    }
    if (Game.cpu.getUsed() - startingTime > 3){
      Logger.info(`Back up global took: ${(Game.cpu.getUsed() - startingTime).toFixed(3)}`);
    }
  }

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
