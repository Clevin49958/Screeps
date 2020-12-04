// import modules
require('prototype.spawn')();
var Traveler = require('Traveler');
require('version');
let watcher = require('watch-client');
let stateScanner = require('stateScanner');
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
        Memory.SCRIPT_VERSION = SCRIPT_VERSION
        console.log('New code uploaded')
    }

    if (Game.cpu.bucket < 2000 || false) {
        // skip ticket
        Logger.warn(`Skipping tick ${Game.time}, current bucket: ${Game.cpu.bucket}`)
        return;
    }

    // Remove dead screeps in memory
    for (let name in Memory.creeps) {
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

    for (let room in Memory.myRooms) {
        link.ship(room);
    }
    for (let name in Game.spawns) {
        lib.generateCreeps(name);
        Logger.trace('-----------------------')
    }

    // watch values
    watcher();

    stateScanner.stateScanner();

    if (Game.time % helper.logRate == 0){
        Logger.info(
            '--------------------------------------------------------');
    } else if (Game.time % 2){
        Logger.info(`------------`);
    }
  });
}