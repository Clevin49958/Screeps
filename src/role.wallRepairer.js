const {
    WALL_REPAIRER
} = require('./helper');
const helper = require('./helper');
const roleUpgrader = require('./role.upgrader');

function findWall(creep) {
    var walls = creep.room.find(FIND_STRUCTURES, {
        filter: (s) => ((s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) &&
            s.hits < 900000)
    });
    var target = undefined;
    var percentage = 0.95;
    for (let name in walls) {
        var wall = walls[name];
        if (wall.hits / wall.hitsMax < percentage) {
            target = wall;
            percentage = wall.hits / wall.hitsMax;
        }
    }
    if (target) creep.memory.wall = target.id;
}

module.exports = {
    // a function to run the logic for this role
    run: function(creep) {
        creep.say(WALL_REPAIRER.slice(0, 1));
        if (creep.memory.working == true && creep.memory.role != WALL_REPAIRER && (!creep.memory.WR || Game.time - creep.memory.WR > 30)) {
            findWall(creep);
            creep.memory.WR = Game.time;
        }
        // if creep is trying to repair something but has no energy left
        if (creep.memory.working == true && creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            // switch state
            creep.memory.working = false;
            creep.memory.wall = undefined;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
            // switch state
            creep.memory.working = true;
            findWall(creep);
        }
        // if creep is supposed to repair something
        if (creep.memory.working == true) {
            // find all walls in the room
            // console.log(creep.memory.walls.map(Game.getObjectById))

            // if we find a wall that has to be repaired
            if (creep.memory.wall != undefined) {
                var wall = Game.getObjectById(creep.memory.wall)
                // creep.say(`${creep.memory.wall.pos.x} ${creep.memory.wall.pos.y}`)
                // try to repair it, if not in range
                if (creep.repair(wall) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(wall);
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
            if (creep.memory.target && creep.memory.target != creep.room.name) {
                helper.moveTargetRoom(creep);
                return;
            }
            if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
                if (helper.withdrawContainer(creep)) return;
            }
            if (helper.withdrawContainerIfRich(creep)) return;
            if (helper.harvestLoot(creep)) return;
        }
    }
};