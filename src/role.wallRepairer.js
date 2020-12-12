const {
  WALL_REPAIRER,
} = require('./helper');
const helper = require('./helper');
const roleUpgrader = require('./role.upgrader');

/**
 *
 * @param {Creep} creep creep to perform task
 */
function findWall(creep) {
  const walls = Game.rooms[creep.memory.target].find(FIND_STRUCTURES, {
    filter: (s) => ((s.structureType == STRUCTURE_WALL ||
    s.structureType == STRUCTURE_RAMPART) && s.hits < 900000),
  });
  let target = undefined;
  let minHits = 1000000;
  for (const name in walls) {
    if ({}.hasOwnProperty.call(walls, name)) {
      const wall = walls[name];
      if (wall.hits < minHits) {
        target = wall;
        minHits = wall.hits;
      }
    }
  }
  if (target) {
    creep.memory.wall = target.id;
  }
}

module.exports = {
  /**
   * a function to run the logic for this role
   * @param {Creep} creep creep to exec
  */
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
    } else if (creep.memory.working == false && creep.store
        .getFreeCapacity(RESOURCE_ENERGY) == 0) {
      // if creep is harvesting energy but is full
      // switch state
      creep.memory.working = true;
      findWall(creep);
    }

    const wall = Game.getObjectById(creep.memory.wall);

    // if creep is supposed to repair something
    if (creep.memory.working == true) {
      // if we find a wall that has to be repaired
      if (wall) {
        if (creep.repair(wall) == ERR_NOT_IN_RANGE) {
          // move towards it
          creep.myMoveTo(wall);
        }
      } else {
        // if we can't fine one
        // look for construction sites
        roleUpgrader.run(creep);
      }
    } else {
      // if creep is supposed to harvest energy from source
      if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
        if (helper.withdrawEnergy(creep)) return;
      }

      if (helper.harvestLoot(creep)) return;
      if (helper.withdrawContainerIfRich(creep)) return;
    }
  },
};
