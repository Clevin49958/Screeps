// import modules
require('prototype.spawn')();
require('version')
var stateScanner = require('stateScanner');
const helper = require('./helper');
const lib = require('./lib');
const tower = require('./tower');
const init = require('./init');
module.exports.loop = function () {
    // update code check
    if(!Memory.SCRIPT_VERSION || Memory.SCRIPT_VERSION != SCRIPT_VERSION) {
        Memory.SCRIPT_VERSION = SCRIPT_VERSION
        console.log('New code uploaded')
    }

    stateScanner.stateScanner();

    // Remove dead screeps in memory
    for (let name in Memory.creeps) {
        // and checking if the creep is still alive
        if (!Game.creeps[name]) {
            // if not, delete the memory entry
            delete Memory.creeps[name];
        }
    }

    tower.defendMyRoom();

    lib.runCreeps();

    lib.generateCreeps();

    init.minCreeps();

    init.alter();

    init.alterOnce();
    
    if (Game.time%helper.logRate == 0) 
        console.log('--------------------------------------------------------');
};