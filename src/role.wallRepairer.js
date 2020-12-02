const {
    WALL_REPAIRER
} = require('./helper');
const helper = require('./helper');
const roleUpgrader = require('./role.upgrader');

function findWall(creep) {
    var walls = Game.rooms[creep.memory.target].find(FIND_STRUCTURES, {
        filter: (s) => ((s.structureType == STRUCTURE_WALL || s
                .structureType == STRUCTURE_RAMPART) &&
            s.hits < 900000)
    });
    var target = undefined;
    var minHits = 1000000;
    for (let name in walls) {
        var wall = walls[name];
        if (wall.hits < minHits) {
            target = wall;
            minHits = wall.hits;
        }
    }
    if (target) {
        creep.memory.wall = target.id;
    }
}

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        creep.say(WALL_REPAIRER.slice(0, 1));

        if (creep.memory.working == true && (!creep.memory.WR || Game
                .time - creep.memory.WR > 30)) {
            findWall(creep);
            creep.memory.WR = Game.time;
        }
        // if creep is trying to repair something but has no energy left
        if (creep.memory.working == true && creep.store.getUsedCapacity(
                RESOURCE_ENERGY) == 0) {
            // switch state
            creep.memory.working = false;
            creep.memory.wall = undefined;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.store
            .getFreeCapacity(RESOURCE_ENERGY) == 0) {
            // switch state
            creep.memory.working = true;
            findWall(creep);
        }

        var wall = Game.getObjectById(creep.memory.wall);

        // if creep is supposed to repair something
        if (creep.memory.working == true) {

            // if we find a wall that has to be repaired
            if (wall) {
                if (creep.repair(wall) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.myMoveTo(wall);
                }
            }
            // if we can't fine one
            else {
                // look for construction sites
                roleUpgrader.run(creep);
            }
        }
        // if creep is supposed to harvest energy from source
        else {
            if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
                if (helper.withdrawEnergy(creep)) return;
            }
            
            if (helper.harvestLoot(creep)) return;
            if (helper.withdrawContainerIfRich(creep)) return;
        }
    }
};