const helper = require('./helper');

/**
 * get the first flag position without a creep
 *
 * flag should be name in the format of up-${room}-${index}
 * where index is integer starting from 1
 * @param {Creep} creep current creep
 * @returns {RoomPosition} position of flag, null otherwise
 */
function getDestinyFlag(creep) {
  const room = creep.room.name;
  let index = 1;
  let flag = null;
  let creeps = null;
  while (Game.flags[`up-${room}-${index}`]) {
    // flag is present

    /** @type {Flag} */
    flag = Game.flags[`up-${room}-${index}`];
    creeps = Game.rooms[room].lookForAt(LOOK_CREEPS, flag.pos);
    if (creeps.length == 0 || creeps[0].id == creep.id) {
      // there is no creep on the flag
      return flag.pos;
    } else {
      index++;
    }
  }

  // no free flag/no flag present
  return null;
}

module.exports = {
  updateWorkingState: function(creep) {
    // switch working state
    if (creep.memory.working == true &&
      (creep.store.getUsedCapacity(RESOURCE_ENERGY) < creep.getActiveBodyparts(WORK) &&
        creep.getActiveBodyparts(WORK) > creep.body.length / 3 ||
        creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0
      )) {
      creep.memory.working = false;
    } else if (creep.memory.working == false && creep.store.getUsedCapacity(RESOURCE_ENERGY) ==
      creep.store.getCapacity(RESOURCE_ENERGY)) {
      creep.memory.working = true;
    }
  },
  
  /**
   * upgrader role
   * @param {Creep} creep creep
   */
  run: function(creep) {
    // creep.say(UPGRADER.slice(0, 1))
    if (helper.moveTargetRoom(creep)) {
      return;
    }

    

    // if creep is supposed to transfer energy to the controller
    if (creep.memory.working == true) {
      if (creep.upgradeController(creep.room.controller) ==
                ERR_NOT_IN_RANGE) {
        // if not in range, move towards the controller
        creep.myMoveTo(creep.room.controller);
      }

      if (creep.room.controller.my) {
        // try to upgrade the controller
        if (creep.pos.inRangeTo(creep.room.controller, 3)) {
          creep.upgradeController(creep.room.controller);
        }
        // move to position
        const destination = getDestinyFlag(creep);
        if (destination) {
          if (!creep.pos.isEqualTo(destination)) {
            creep.myMoveTo(destination);
          }
        } else {
          creep.myMoveTo(creep.room.controller, {range: 3});
        }
      } else {
        // probs in a hostile room? dismantle spawn and extensions
        const target = creep.pos.findClosestByPath(
            FIND_STRUCTURES, {
              filter: (s) => s.structureType ==
                            STRUCTURE_SPAWN || s.structureType ==
                            STRUCTURE_EXTENSION,
            });
        if (target) {
          if (creep.dismantle(target) == ERR_NOT_IN_RANGE) {
            creep.myMoveTo(target);
          }
        }
      }
    } else {
      // get energy
      if (helper.withdrawStorage(creep)) return;
      if (helper.withdrawContainerIfRich(creep)) return;

      // if (helper.harvestLoot(creep)) return;
      helper.harvest(creep);
    }
  },
};
